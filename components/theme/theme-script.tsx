import { themeInitScript } from "./theme";

/** Inline, render-blocking theme script for <head>. See `themeInitScript`. */
export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />;
}
