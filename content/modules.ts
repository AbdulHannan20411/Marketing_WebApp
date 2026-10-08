/**
 * Plan modules shown on the site, in display order. Labels live in messages under
 * `modules.<key>`. The API also returns `email`, `social` and `api`; those features are
 * not launched, so they are deliberately absent here and ignored everywhere.
 */
export const moduleKeys = [
  "whatsapp",
  "crm",
  "sales",
  "leads",
  "automations",
  "reporting",
  "ai",
  "lead_scoring",
  "employees",
] as const;

export type ModuleKey = (typeof moduleKeys)[number];

export function isModuleKey(value: string): value is ModuleKey {
  return (moduleKeys as readonly string[]).includes(value);
}
