import type { Locale } from "@/lib/i18n/routing";

/**
 * Branded transactional email layout: table-based, inline styles, light colours that
 * survive dark-mode email clients, right-to-left for Urdu, and a plain-text twin.
 */

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Escapes and keeps line breaks from user-written text. */
function paragraphHtml(text: string): string {
  return escapeHtml(text).replace(/\r?\n/g, "<br />");
}

export type EmailContent = {
  locale: Locale;
  /** Hidden preview text shown by inboxes. */
  preheader: string;
  heading: string;
  paragraphs: string[];
  /** Labelled facts, e.g. reference, topic, answers. */
  details?: { label: string; value: string }[];
  /** A quoted block of user-written text (message or reply). */
  quote?: { label: string; body: string };
  cta?: { label: string; url: string };
  footer: string;
};

export function renderEmail(content: EmailContent): { html: string; text: string } {
  const rtl = content.locale === "ur";
  const dir = rtl ? "rtl" : "ltr";
  const align = rtl ? "right" : "left";
  const font = rtl
    ? "'Noto Nastaliq Urdu','Jameel Noori Nastaleeq',Tahoma,Arial,sans-serif"
    : "Arial,Helvetica,sans-serif";
  const lineHeight = rtl ? "2" : "1.6";

  const details = content.details?.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-collapse:collapse">${content.details
        .map(
          (row) =>
            `<tr><td style="padding:6px 0;color:#475569;font-size:13px;width:38%;vertical-align:top;text-align:${align}">${escapeHtml(row.label)}</td><td style="padding:6px 0;color:#0f172a;font-size:14px;vertical-align:top;text-align:${align}">${paragraphHtml(row.value)}</td></tr>`,
        )
        .join("")}</table>`
    : "";

  const quote = content.quote
    ? `<p style="margin:0 0 6px;color:#475569;font-size:13px">${escapeHtml(content.quote.label)}</p><div style="margin:0 0 24px;padding:12px 16px;background:#f1f5f9;border-${rtl ? "right" : "left"}:4px solid #16a34a;border-radius:6px;font-size:14px;color:#0f172a">${paragraphHtml(content.quote.body)}</div>`
    : "";

  const cta = content.cta
    ? `<p style="margin:8px 0 24px"><a href="${escapeHtml(content.cta.url)}" style="display:inline-block;background:#15803d;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:bold;font-size:15px">${escapeHtml(content.cta.label)}</a></p>`
    : "";

  const html = `<!doctype html>
<html lang="${content.locale}" dir="${dir}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${escapeHtml(content.heading)}</title></head>
<body style="margin:0;padding:0;background:#f8fafc">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(content.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:24px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="${dir}" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;font-family:${font};line-height:${lineHeight};color:#0f172a;text-align:${align}">
<tr><td style="padding:28px 32px 8px"><span dir="ltr" style="font-family:Arial,Helvetica,sans-serif;font-weight:bold;font-size:20px;color:#16a34a">NextReach</span></td></tr>
<tr><td style="padding:8px 32px 28px">
<h1 style="margin:0 0 16px;font-size:21px;line-height:1.5">${escapeHtml(content.heading)}</h1>
${content.paragraphs.map((p) => `<p style="margin:0 0 16px;font-size:15px">${paragraphHtml(p)}</p>`).join("")}
${details}${quote}${cta}
</td></tr>
<tr><td style="padding:16px 32px 24px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b">${paragraphHtml(content.footer)}</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const text = [
    content.heading,
    "",
    ...content.paragraphs.flatMap((p) => [p, ""]),
    ...(content.details?.length
      ? [...content.details.map((row) => `${row.label}: ${row.value}`), ""]
      : []),
    ...(content.quote ? [`${content.quote.label}`, content.quote.body, ""] : []),
    ...(content.cta ? [`${content.cta.label}: ${content.cta.url}`, ""] : []),
    "--",
    content.footer,
  ].join("\n");

  return { html, text };
}
