import { Geist, Geist_Mono, Noto_Nastaliq_Urdu } from "next/font/google";

/** Latin UI font (variable). Preloaded on every route. */
export const latinFont = Geist({
  subsets: ["latin"],
  variable: "--font-latin",
  display: "swap",
});

/**
 * Urdu Nastaliq font (variable). It is large, and the root layout would otherwise
 * preload it on English pages too, so preloading is off. The fixed Urdu line-height
 * in globals.css keeps the swap from shifting layout.
 */
export const urduFont = Noto_Nastaliq_Urdu({
  subsets: ["arabic"],
  variable: "--font-nastaliq",
  display: "swap",
  preload: false,
});

/** Monospace accent font for small labels and figures. Small, so it can preload. */
export const monoFont = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
  weight: ["500"],
});
