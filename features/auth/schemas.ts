import { z } from "zod";

import { locales } from "@/lib/i18n/routing";
import { normalisePakistaniPhone } from "@/lib/validation/phone";

/**
 * Shared by the client forms (React Hook Form) and the server actions, which always
 * re-validate. Error messages are codes; the UI translates them via `validation.<code>`.
 */

export type ValidationCode =
  | "required"
  | "email"
  | "nameLength"
  | "phone"
  | "passwordMin"
  | "passwordMax"
  | "passwordMismatch"
  | "consent";

const email = z
  .string()
  .trim()
  .min(1, "required")
  .max(254, "email")
  .pipe(z.email("email"))
  .transform((value) => value.toLowerCase());

const password = z.string().min(8, "passwordMin").max(72, "passwordMax");

const fullName = z.string().trim().min(2, "nameLength").max(120, "nameLength");

/** Optional Pakistani phone; empty means "not given". Normalised to +92… */
export const optionalPhone = z
  .string()
  .trim()
  .max(32, "phone")
  .transform((value, ctx) => {
    if (value === "") return null;
    const normalised = normalisePakistaniPhone(value);
    if (!normalised) {
      ctx.addIssue({ code: "custom", message: "phone" });
      return z.NEVER;
    }
    return normalised;
  });

export const localeField = z.enum(locales);

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "required").max(72, "passwordMax"),
});

export const signUpSchema = z
  .object({
    fullName,
    email,
    phone: optionalPhone,
    password,
    confirmPassword: z.string(),
    preferredLocale: localeField,
    consent: z.literal(true, "consent"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "passwordMismatch",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({ password, confirmPassword: z.string() })
  .refine((values) => values.password === values.confirmPassword, {
    message: "passwordMismatch",
    path: ["confirmPassword"],
  });

export const profileSchema = z.object({
  fullName,
  phone: optionalPhone,
  preferredLocale: localeField,
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "required").max(72, "passwordMax"),
    password,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "passwordMismatch",
    path: ["confirmPassword"],
  });

/** Inputs (before transforms), for form default values. */
export type SignInInput = z.input<typeof signInSchema>;
export type SignUpInput = z.input<typeof signUpSchema>;
export type ForgotPasswordInput = z.input<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.input<typeof resetPasswordSchema>;
export type ProfileInput = z.input<typeof profileSchema>;
export type ChangePasswordInput = z.input<typeof changePasswordSchema>;

/** Outputs (after transforms): what a submit handler receives. */
export type SignUpOutput = z.output<typeof signUpSchema>;
export type ProfileOutput = z.output<typeof profileSchema>;

/** Field errors as codes, keyed by field name. */
export function fieldErrors(error: z.ZodError): Record<string, ValidationCode> {
  const out: Record<string, ValidationCode> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message as ValidationCode;
  }
  return out;
}
