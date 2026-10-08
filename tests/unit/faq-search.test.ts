import { describe, expect, it } from "vitest";

import { filterGroups, normalise, type FaqGroupData } from "@/components/marketing/faq-search";

const groups: FaqGroupData[] = [
  {
    id: "a",
    title: "WhatsApp",
    items: [
      { id: "t", question: "What is a message template?", answer: "A pre-approved message." },
      { id: "w", question: "What is the 24-hour window?", answer: "Reply freely for 24 hours." },
    ],
  },
  {
    id: "b",
    title: "اردو",
    items: [{ id: "u", question: "ٹیمپلیٹ کیا ہے؟", answer: "پہلے سے منظور شدہ پیغام۔" }],
  },
];

describe("FAQ search", () => {
  it("returns everything for an empty query", () => {
    expect(filterGroups(groups, "   ")).toEqual(groups);
  });

  it("matches questions and answers, case-insensitively, requiring every word", () => {
    const result = filterGroups(groups, "TEMPLATE pre-approved");
    expect(result.flatMap((group) => group.items.map((item) => item.id))).toEqual(["t"]);
  });

  it("drops groups with no matches", () => {
    expect(filterGroups(groups, "hours").map((group) => group.id)).toEqual(["a"]);
  });

  it("matches Urdu text, ignoring diacritics", () => {
    expect(filterGroups(groups, "منظور").map((group) => group.id)).toEqual(["b"]);
    expect(normalise("شُدہ")).toBe(normalise("شدہ"));
  });
});
