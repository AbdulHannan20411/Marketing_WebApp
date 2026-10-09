# Fonts for generated Open Graph images

`next/og` and HarfBuzz need TTF/OTF files, so these are kept here rather than
loaded through `next/font`. Both families are licensed under the SIL Open Font
License 1.1.

- **Geist** (Latin): https://github.com/vercel/geist-font
- **Noto Nastaliq Urdu** (Urdu): https://github.com/notofonts/nastaliq

Satori (inside `next/og`) can't shape Nastaliq or lay out right-to-left text, so
Urdu text is shaped with HarfBuzz (`lib/og/shaped-text.ts`) and embedded as an
SVG of glyph outlines.
