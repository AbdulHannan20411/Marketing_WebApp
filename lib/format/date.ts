import type { Locale } from "@/lib/i18n/routing";

/** Date and time in Pakistan time, e.g. "9 Oct 2026, 3:15 pm" (or the Urdu form). */
export function formatDateTime(locale: Locale, iso: string): string {
  return new Intl.DateTimeFormat(locale === "ur" ? "ur-PK" : "en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Karachi",
  }).format(new Date(iso));
}

export function formatFileSize(locale: Locale, bytes: number): string {
  const format = (value: number, unit: "kilobyte" | "megabyte") =>
    new Intl.NumberFormat(locale === "ur" ? "ur-PK" : "en-PK", {
      style: "unit",
      unit,
      maximumFractionDigits: 1,
    }).format(value);
  return bytes >= 1024 * 1024
    ? format(bytes / (1024 * 1024), "megabyte")
    : format(Math.max(1, bytes / 1024), "kilobyte");
}
