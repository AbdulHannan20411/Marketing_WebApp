/**
 * Pakistani phone numbers. Accepts common ways people type them and normalises to
 * E.164 (+92…):
 *   mobile:   0300 1234567, 03001234567, +92 300 1234567, 0092-300-1234567
 *   landline: 042 35761234, +92 42 35761234
 */
export function normalisePakistaniPhone(input: string): string | null {
  const compact = input.replace(/[\s\-().]/g, "");
  let national: string;
  if (compact.startsWith("+92")) national = compact.slice(3);
  else if (compact.startsWith("0092")) national = compact.slice(4);
  else if (compact.startsWith("92") && compact.length >= 12) national = compact.slice(2);
  else if (compact.startsWith("0")) national = compact.slice(1);
  else return null;

  if (!/^\d+$/.test(national)) return null;
  // Mobile: 3XX XXXXXXX (10 digits). Landline: area code + subscriber, 9–10 digits.
  const mobile = /^3\d{9}$/.test(national);
  const landline = /^[2-9]\d{8,9}$/.test(national);
  return mobile || landline ? `+92${national}` : null;
}
