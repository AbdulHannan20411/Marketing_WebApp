import { describe, expect, it } from "vitest";

import en from "@/messages/en.json";
import ur from "@/messages/ur.json";

type Tree = { [key: string]: string | Tree };

function flatten(tree: Tree, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") out[path] = value;
    else Object.assign(out, flatten(value, path));
  }
  return out;
}

/** Top-level ICU argument names, e.g. {year} or {count, plural, ...} → year, count. */
function placeholders(message: string): string[] {
  const names = new Set<string>();
  let depth = 0;
  for (let i = 0; i < message.length; i += 1) {
    const char = message[i];
    if (char === "{") {
      if (depth === 0) {
        const match = /^\{\s*([A-Za-z0-9_]+)/.exec(message.slice(i));
        if (match?.[1]) names.add(match[1]);
      }
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
    }
  }
  return [...names].sort();
}

const enFlat = flatten(en as Tree);
const urFlat = flatten(ur as Tree);

describe("message catalogues", () => {
  it("Urdu has exactly the same keys as English", () => {
    expect(Object.keys(urFlat).sort()).toEqual(Object.keys(enFlat).sort());
  });

  it("has no empty messages", () => {
    for (const [key, value] of [...Object.entries(enFlat), ...Object.entries(urFlat)]) {
      expect(value.trim(), key).not.toBe("");
    }
  });

  it("uses the same ICU placeholders in both languages", () => {
    for (const key of Object.keys(enFlat)) {
      expect(placeholders(urFlat[key] ?? ""), key).toEqual(placeholders(enFlat[key] ?? ""));
    }
  });

  it("writes Urdu copy in Urdu script (except proper names and language names)", () => {
    const latinOnly = Object.entries(urFlat).filter(
      ([key, value]) =>
        !/[؀-ۿ]/.test(value) &&
        !key.startsWith("common.language.names") &&
        !["metadata.siteName", "metadata.titleTemplate"].includes(key),
    );
    expect(latinOnly.map(([key]) => key)).toEqual([]);
  });
});
