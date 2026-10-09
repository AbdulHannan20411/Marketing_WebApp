import { z } from "zod";

/**
 * Zod, configured for this site. Import `z` from here, not from "zod".
 *
 * `jitless` stops Zod from probing `new Function` to speed up object parsing. Our
 * CSP forbids eval, so the probe was reported as a CSP violation in the browser.
 * Configuring it here guarantees the setting is applied before any schema is built.
 */
z.config({ jitless: true });

export { z };
