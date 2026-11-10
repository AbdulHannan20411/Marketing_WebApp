/**
 * Phone numbers from any country, normalised to E.164 (+<country code><number>).
 * Accepts the country code written with a plus or with 00, and ignores spaces,
 * dashes, dots and brackets:
 *   +44 7700 900123, 0044 7700 900123, +1 (415) 555-0100, +92 300 1234567
 * Pakistani mobiles typed the local way (0300 1234567) are also accepted as +92, so
 * existing visitors don't have to change how they write their number. Any other
 * number without a country code is rejected: there is no way to tell which country
 * it belongs to.
 */
export function normalisePhone(input: string): string | null {
  const compact = input.replace(/[\s\-().]/g, "");
  if (/^03\d{9}$/.test(compact)) return `+92${compact.slice(1)}`;

  let digits: string;
  if (compact.startsWith("+")) digits = compact.slice(1);
  else if (compact.startsWith("00")) digits = compact.slice(2);
  else return null;

  // E.164: a country code (never starting with 0) and at most 15 digits in all.
  return /^[1-9]\d{6,14}$/.test(digits) ? `+${digits}` : null;
}
