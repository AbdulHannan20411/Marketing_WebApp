export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "nr-theme";
export const DEFAULT_THEME: Theme = "light";

export function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

/**
 * Runs synchronously in <head> before first paint, so a saved dark preference never
 * flashes light. Light is the default; the OS preference is intentionally not used.
 * It also marks the document as JS-enabled (`data-js`) so scroll reveals can start
 * hidden without a flash; without JavaScript, content is simply shown.
 */
export const themeInitScript = `(function(){var d=document.documentElement;d.setAttribute("data-js","");try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(t==="dark"){d.classList.add("dark");d.style.colorScheme="dark"}}catch(e){}})()`;

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

export function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(stored) ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function storeTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage can be unavailable (private mode, blocked site data); the toggle still works for this page view.
  }
}
