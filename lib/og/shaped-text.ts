import "server-only";

import * as hb from "harfbuzzjs";

/**
 * Right-to-left text for Open Graph images. Satori (next/og) can't lay out Urdu: it
 * has no right-to-left word order, mis-measures joined Arabic-script words and
 * can't apply Nastaliq's OpenType rules. HarfBuzz (the shaping engine browsers use)
 * shapes it properly here; the result is an SVG of glyph outlines the image embeds.
 */

type ShapingFont = { font: hb.Font; upem: number };

export function loadShapingFont(data: Uint8Array): ShapingFont {
  const face = new hb.Face(new hb.Blob(data));
  return { font: new hb.Font(face), upem: face.upem };
}

const ARABIC_SCRIPT = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;

type Run = { width: number; svg: string };

/** One word, shaped in its own direction with the font for its script. */
function shapeWord(word: string, fonts: { rtl: ShapingFont; ltr: ShapingFont }, size: number): Run {
  const { font, upem } = ARABIC_SCRIPT.test(word) ? fonts.rtl : fonts.ltr;
  const buffer = new hb.Buffer();
  buffer.addText(word);
  buffer.guessSegmentProperties();
  hb.shape(font, buffer);

  const scale = size / upem;
  const infos = buffer.getGlyphInfos();
  const positions = buffer.getGlyphPositions();
  let pen = 0;
  let svg = "";
  // HarfBuzz returns glyphs in visual (left-to-right) order for either direction.
  infos.forEach((info, index) => {
    const position = positions[index]!;
    const path = font.glyphToPath(info.codepoint);
    if (path) {
      const x = (pen + position.xOffset) * scale;
      const y = -position.yOffset * scale;
      svg += `<path transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${scale} ${-scale})" d="${path}"/>`;
    }
    pen += position.xAdvance;
  });
  return { width: pen * scale, svg };
}

export type ShapedText = { src: string; width: number; height: number };

/**
 * Wraps right-to-left text to `maxWidth` and returns it as an SVG data URL. Lines
 * are right-aligned; words keep their own direction (so "NextReach" or "24" read
 * correctly inside Urdu text).
 */
export function shapeRtlText(
  text: string,
  options: {
    fonts: { rtl: ShapingFont; ltr: ShapingFont };
    size: number;
    maxWidth: number;
    color: string;
    /** Distance between baselines, as a multiple of the font size. */
    lineHeight: number;
    /** Space above the first baseline and below the last, as multiples of the size. */
    ascent: number;
    descent: number;
    maxLines?: number;
  },
): ShapedText {
  const { fonts, size, maxWidth, color, lineHeight, ascent, descent, maxLines = 4 } = options;
  const space = shapeWord(" ", fonts, size).width || size * 0.3;
  const words = text
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => shapeWord(word, fonts, size));

  // Greedy line breaking on the shaped widths.
  const lines: Run[][] = [];
  let line: Run[] = [];
  let lineWidth = 0;
  for (const word of words) {
    const next = line.length ? lineWidth + space + word.width : word.width;
    if (line.length && next > maxWidth) {
      lines.push(line);
      line = [word];
      lineWidth = word.width;
    } else {
      line.push(word);
      lineWidth = next;
    }
  }
  if (line.length) lines.push(line);
  const shown = lines.slice(0, maxLines);

  const widths = shown.map((words) =>
    words.reduce((sum, word, index) => sum + word.width + (index ? space : 0), 0),
  );
  const width = Math.ceil(Math.min(maxWidth, Math.max(1, ...widths)));
  const height = Math.ceil(size * (ascent + (shown.length - 1) * lineHeight + descent));

  let body = "";
  shown.forEach((words, lineIndex) => {
    const baseline = size * (ascent + lineIndex * lineHeight);
    // First word at the right edge, then leftwards.
    let right = width;
    for (const word of words) {
      const x = right - word.width;
      body += `<g transform="translate(${x.toFixed(2)} ${baseline.toFixed(2)})">${word.svg}</g>`;
      right = x - space;
    }
  });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><g fill="${color}">${body}</g></svg>`;
  return {
    src: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`,
    width,
    height,
  };
}
