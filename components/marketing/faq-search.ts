import type { FaqEntry } from "./faq-accordion";

export type FaqGroupData = { id: string; title: string; items: FaqEntry[] };

/** Placeholder replaced with the visitor's query in the pre-translated "no results" text. */
export const QUERY_TOKEN = "__QUERY__";

/**
 * Normalises text for matching: case-insensitive, ignores Latin accents and Urdu/Arabic
 * diacritics (zer, zabar, pesh…), and collapses whitespace.
 */
export function normalise(text: string): string {
  return text
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ًͯ-ٰٟ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Keeps items whose question or answer contains every word of the query. */
export function filterGroups(groups: FaqGroupData[], query: string): FaqGroupData[] {
  const terms = normalise(query).split(" ").filter(Boolean);
  if (terms.length === 0) return groups;
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const haystack = normalise(`${item.question} ${item.answer}`);
        return terms.every((term) => haystack.includes(term));
      }),
    }))
    .filter((group) => group.items.length > 0);
}
