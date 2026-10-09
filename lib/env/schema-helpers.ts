import { z } from "../validation/zod";

/** Trims strings and turns blank values into `undefined`, so `FOO=` means "not set". */
function blankToUndefined(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

/** An optional env var; missing or blank becomes `undefined`. */
export const optionalString = z.preprocess(blankToUndefined, z.string().optional());

/** An optional absolute URL; missing or blank becomes `undefined`, malformed fails. */
export const optionalUrl = z.preprocess(blankToUndefined, z.url().optional());

/** An absolute URL with a fallback when missing or blank. */
export function urlWithDefault(fallback: string) {
  return z.preprocess(blankToUndefined, z.url().default(fallback));
}

/** An optional base URL with trailing slashes removed (so paths can be appended). */
export const optionalBaseUrl = z.preprocess((value) => {
  const cleaned = blankToUndefined(value);
  return typeof cleaned === "string" ? cleaned.replace(/\/+$/, "") : cleaned;
}, z.url().optional());
