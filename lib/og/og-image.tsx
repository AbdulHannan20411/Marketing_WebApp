import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";

import type { FeatureSlug } from "@/content/feature-slugs";
import { isLocale, type Locale } from "@/lib/i18n/routing";
import { siteConfig } from "@/lib/site";

import { loadShapingFont, shapeRtlText } from "./shaped-text";

/**
 * Open Graph images (1200×630) for the public pages, generated at build time with
 * next/og. Each page's image shows its own title and description, in its language.
 */

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

export type OgPage =
  | "home"
  | "features"
  | "pricing"
  | "useCases"
  | "about"
  | "faq"
  | "contact"
  | "privacy"
  | "terms"
  | "refund"
  | { feature: FeatureSlug };

// Read once per server instance (the files never change at runtime).
const font = (file: string) => readFile(join(process.cwd(), "assets/fonts", file));
const fonts = Promise.all([
  font("Geist-Bold.ttf"),
  font("Geist-Regular.ttf"),
  font("NotoNastaliqUrdu-Bold.ttf"),
  font("NotoNastaliqUrdu-Regular.ttf"),
]).then(([geistBold, geistRegular, nastaliqBold, nastaliqRegular]) => ({
  // For Satori (Latin text).
  satori: { geistBold, geistRegular },
  // For HarfBuzz (Urdu text, with Geist for Latin words inside it).
  bold: { rtl: loadShapingFont(nastaliqBold), ltr: loadShapingFont(geistBold) },
  regular: { rtl: loadShapingFont(nastaliqRegular), ltr: loadShapingFont(geistRegular) },
}));

const BRAND = "#16a34a";
const INK = "#0f172a";
const MUTED = "#475569";

async function pageText(locale: Locale, page: OgPage) {
  if (typeof page === "object") {
    const t = await getTranslations({ locale, namespace: `featurePages.pages.${page.feature}` });
    return { title: t("metaTitle"), description: t("metaDescription") };
  }
  if (page === "privacy" || page === "terms" || page === "refund") {
    const t = await getTranslations({ locale, namespace: `legal.${page}` });
    return { title: t("metaTitle"), description: t("metaDescription") };
  }
  const t = await getTranslations({ locale, namespace: page });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export async function renderOgImage(params: Promise<{ locale: string }>, page: OgPage) {
  const { locale: value } = await params;
  const locale: Locale = isLocale(value) ? value : "en";
  const rtl = locale === "ur";
  const [{ title, description }, loaded] = await Promise.all([pageText(locale, page), fonts]);
  const host = new URL(siteConfig.url).host;
  const shortDescription =
    description.length > 150 ? `${description.slice(0, 147).trimEnd()}…` : description;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px 72px",
        background: "linear-gradient(135deg, #ffffff 0%, #ffffff 55%, #dcfce7 100%)",
        fontFamily: "Geist",
        color: INK,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <svg width="64" height="64" viewBox="0 0 32 32">
          <rect width="32" height="32" rx="9" fill={BRAND} />
          <path
            d="M9 21.5V12a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v5.5a3 3 0 0 1-3 3h-6.5L9 24v-2.5Z"
            fill="#fff"
          />
          <path
            d="m15 15.5 4-3.5m0 0h-3m3 0v3"
            stroke={BRAND}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
        <div style={{ display: "flex", fontSize: 40, fontWeight: 700, letterSpacing: -1 }}>
          {siteConfig.name}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
          alignItems: rtl ? "flex-end" : "flex-start",
        }}
      >
        {rtl ? (
          <ShapedImage
            text={shapeRtlText(title, {
              fonts: loaded.bold,
              size: title.length > 30 ? 52 : 60,
              maxWidth: 1050,
              color: INK,
              lineHeight: 1.9,
              ascent: 1.45,
              descent: 0.8,
              maxLines: 2,
            })}
          />
        ) : (
          <div
            style={{
              display: "flex",
              fontSize: title.length > 40 ? 64 : 76,
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: -2,
              maxWidth: 1050,
            }}
          >
            {title}
          </div>
        )}
        {rtl ? (
          <ShapedImage
            text={shapeRtlText(description, {
              fonts: loaded.regular,
              size: 28,
              maxWidth: 1000,
              color: MUTED,
              lineHeight: 1.95,
              ascent: 1.5,
              descent: 0.8,
              maxLines: 3,
            })}
          />
        ) : (
          <div
            style={{ display: "flex", fontSize: 30, lineHeight: 1.4, color: MUTED, maxWidth: 1000 }}
          >
            {shortDescription}
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 26, color: MUTED }}>
        <div
          style={{ display: "flex", width: 40, height: 6, borderRadius: 3, background: BRAND }}
        />
        {host}
      </div>
    </div>,
    {
      ...ogSize,
      fonts: [
        { name: "Geist", data: loaded.satori.geistBold, weight: 700, style: "normal" },
        { name: "Geist", data: loaded.satori.geistRegular, weight: 400, style: "normal" },
      ],
    },
  );
}

/** Pre-shaped right-to-left text, embedded as an SVG image. */
function ShapedImage({ text }: { text: ReturnType<typeof shapeRtlText> }) {
  // eslint-disable-next-line @next/next/no-img-element -- next/og renders plain <img>.
  return <img src={text.src} width={text.width} height={text.height} alt="" />;
}
