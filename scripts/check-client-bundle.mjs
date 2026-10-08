#!/usr/bin/env node
/**
 * Fails if a server secret ends up in any browser-delivered file after `next build`.
 *
 * Checks the client output (.next/static) for:
 *  - the names of server-only env vars (a sign server code was bundled for the client),
 *  - the actual secret values from the environment / .env.local, when present.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const STATIC_DIR = join(process.cwd(), ".next", "static");
const SECRET_NAMES = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "RESEND_API_KEY",
  "TURNSTILE_SECRET_KEY",
  "NEXTREACH_API_URL",
  "REVALIDATE_SECRET",
  "SUPABASE_DB_URL",
];

function loadDotEnv(file) {
  if (!existsSync(file)) return {};
  const values = {};
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match) values[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
  return values;
}

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (/\.(js|mjs|css|html|json|map)$/.test(entry)) yield full;
  }
}

if (!existsSync(STATIC_DIR)) {
  console.error("No .next/static directory. Run `npm run build` first.");
  process.exit(1);
}

const fileEnv = loadDotEnv(join(process.cwd(), ".env.local"));
const secretValues = SECRET_NAMES.map((name) => process.env[name] || fileEnv[name]).filter(
  (value) => typeof value === "string" && value.length >= 8,
);

const findings = [];
let scanned = 0;
for (const file of walk(STATIC_DIR)) {
  scanned += 1;
  const content = readFileSync(file, "utf8");
  for (const name of SECRET_NAMES) {
    if (content.includes(name)) findings.push(`${file}: contains the name ${name}`);
  }
  for (const value of secretValues) {
    if (content.includes(value)) findings.push(`${file}: contains a server secret value`);
  }
}

if (findings.length > 0) {
  console.error("Server secrets found in the client bundle:\n" + findings.join("\n"));
  process.exit(1);
}

console.log(
  `Client bundle check passed: ${scanned} files scanned, no server secret names or values (${secretValues.length} secret values checked).`,
);
