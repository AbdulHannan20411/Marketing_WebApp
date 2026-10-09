#!/usr/bin/env node
/**
 * Lighthouse (mobile) on the key pages of a production build, with the targets from
 * the brief: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95.
 *
 *   npm run build && npm run lighthouse
 *   LIGHTHOUSE_URL=https://staging.example.com npm run lighthouse   (a deployed site)
 *
 * Starts `next start` itself when nothing is listening at the URL. Uses Chrome from
 * CHROME_PATH, or Playwright's Chromium. Each page runs LIGHTHOUSE_RUNS times (default 3)
 * and the median counts. HTML reports go to lighthouse-reports/.
 */
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

import { chromium } from "@playwright/test";
import * as chromeLauncher from "chrome-launcher";
import lighthouse from "lighthouse";

try {
  process.loadEnvFile(".env.local");
} catch {
  // Use the environment as-is.
}

// Same origin as NEXT_PUBLIC_SITE_URL, so canonical URLs match the audited pages.
const base = (
  process.env.LIGHTHOUSE_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  "http://localhost:3000"
).replace(/\/$/, "");
// The pages the brief sets targets for. Add more with LIGHTHOUSE_PAGES=/ur,/en/faq.
const pages = (process.env.LIGHTHOUSE_PAGES ?? "/en,/en/pricing,/en/contact").split(",");
const targets = { performance: 0.9, accessibility: 0.95, "best-practices": 0.95, seo: 0.95 };

async function reachable(url) {
  try {
    const response = await fetch(url, { redirect: "manual" });
    return response.status < 500;
  } catch {
    return false;
  }
}

let server;
if (!(await reachable(`${base}/en`))) {
  const { port, hostname } = new URL(base);
  if (!["localhost", "127.0.0.1"].includes(hostname)) {
    console.error(`${base} is not reachable.`);
    process.exit(1);
  }
  console.log(`Starting next start on port ${port || 3000}…`);
  server = spawn(
    process.execPath,
    ["node_modules/next/dist/bin/next", "start", "--port", port || "3000"],
    {
      stdio: "ignore",
    },
  );
  for (let i = 0; i < 60 && !(await reachable(`${base}/en`)); i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

// Warm each page once so the audit measures a served page, not first compilation.
for (const page of pages) await fetch(`${base}${page}`).catch(() => {});

const chrome = await chromeLauncher.launch({
  chromePath: process.env.CHROME_PATH || chromium.executablePath(),
  chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu"],
});

mkdirSync("lighthouse-reports", { recursive: true });
// Lighthouse scores vary run to run; the median of several runs is what counts.
const runs = Math.max(1, Number(process.env.LIGHTHOUSE_RUNS ?? 3));
const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
const rows = [];
let failed = false;
try {
  for (const page of pages) {
    const url = `${base}${page}`;
    const results = [];
    for (let run = 0; run < runs; run += 1) {
      results.push(
        await lighthouse(url, {
          port: chrome.port,
          output: "html",
          logLevel: "error",
          onlyCategories: Object.keys(targets),
        }),
      );
    }
    const row = { page };
    for (const [key, min] of Object.entries(targets)) {
      const score = median(
        results.map((result) => Math.round((result.lhr.categories[key]?.score ?? 0) * 100)),
      );
      row[key] = score;
      if (score < min * 100) failed = true;
    }
    const lcp = results.map((r) => r.lhr.audits["largest-contentful-paint"].numericValue);
    const tbt = results.map((r) => r.lhr.audits["total-blocking-time"].numericValue);
    row.lcp = `${(median(lcp) / 1000).toFixed(1)} s`;
    row.tbt = `${Math.round(median(tbt))} ms`;
    rows.push(row);
    const name = page.replace(/\W+/g, "-").replace(/^-|-$/g, "") || "home";
    writeFileSync(`lighthouse-reports/${name}.html`, results.at(-1).report);
  }
} finally {
  try {
    await chrome.kill();
  } catch {
    // Windows sometimes can't remove the temporary profile; harmless.
  }
  server?.kill();
}

console.table(rows);
console.log(
  `Targets: performance ≥ 90, accessibility ≥ 95, best practices ≥ 95, SEO ≥ 95. Reports: lighthouse-reports/`,
);
process.exit(failed ? 1 : 0);
