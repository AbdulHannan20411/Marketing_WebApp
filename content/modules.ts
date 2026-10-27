/**
 * Plan modules shown on the site, in display order. Labels live in messages under
 * `modules.<key>`. The API also returns `social` and `api`; those features are not
 * launched, so they are deliberately absent here and ignored everywhere. `ads`
 * (WhatsApp Status ads) only works on a plan that also has `whatsapp`.
 */
export const moduleKeys = [
  "whatsapp",
  "email",
  "ecommerce",
  "ads",
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

/** Modules launched recently, marked "New" in the module carousel. */
export const newModuleKeys: readonly ModuleKey[] = ["ads"];

export function isModuleKey(value: string): value is ModuleKey {
  return (moduleKeys as readonly string[]).includes(value);
}
