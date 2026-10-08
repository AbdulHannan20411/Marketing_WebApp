import type { Metadata } from "next";

/** Auth and account pages are private: titled, but kept out of search results. */
export function privatePageMetadata(title: string): Metadata {
  return { title, robots: { index: false, follow: false } };
}
