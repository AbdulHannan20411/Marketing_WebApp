export const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;
export type Utm = Partial<Record<(typeof UTM_KEYS)[number], string>>;

const STORAGE_KEY = "nr-utm";

function fromSearch(search: string): Utm {
  const params = new URLSearchParams(search);
  const utm: Utm = {};
  for (const key of UTM_KEYS) {
    const value = params.get(key)?.trim();
    if (value) utm[key] = value.slice(0, 100);
  }
  return utm;
}

/** Remembers campaign parameters for this browser session (first landing wins). */
export function captureUtm(search: string = window.location.search) {
  const utm = fromSearch(search);
  if (Object.keys(utm).length === 0) return;
  try {
    if (!sessionStorage.getItem(STORAGE_KEY))
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(utm));
  } catch {
    // Storage may be unavailable; the current URL is still used at submit time.
  }
}

/** UTM for a submission: the current URL, else what was captured on landing. */
export function readUtm(search: string = window.location.search): Utm {
  const current = fromSearch(search);
  if (Object.keys(current).length > 0) return current;
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    const parsed = JSON.parse(stored) as Record<string, unknown>;
    const utm: Utm = {};
    for (const key of UTM_KEYS) {
      if (typeof parsed[key] === "string") utm[key] = (parsed[key] as string).slice(0, 100);
    }
    return utm;
  } catch {
    return {};
  }
}
