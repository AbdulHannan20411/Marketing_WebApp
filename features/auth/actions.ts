"use server";

import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { getCurrentProfile } from "@/lib/auth/session";
import { accountHome, safeNextPath } from "@/lib/auth/redirects";
import { publicEnv } from "@/lib/env/public";
import { isLocale, type Locale } from "@/lib/i18n/routing";
import { siteConfig } from "@/lib/site";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  changePasswordSchema,
  fieldErrors,
  forgotPasswordSchema,
  profileSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
  type ValidationCode,
} from "./schemas";

/**
 * Auth server actions. Every input is re-validated here with the same Zod schemas the
 * forms use. Users only ever see generic error codes; details go to the server log.
 */

export type AuthErrorCode =
  | "invalidCredentials"
  | "emailNotConfirmed"
  | "suspended"
  | "rateLimited"
  | "weakPassword"
  | "samePassword"
  | "wrongCurrentPassword"
  | "linkExpired"
  | "notSignedIn"
  | "generic";

export type ActionResult =
  { ok: true } | { ok: false; error?: AuthErrorCode; fieldErrors?: Record<string, ValidationCode> };

function localeOf(value: unknown): Locale {
  return isLocale(value) ? value : "en";
}

/** Absolute URL for links in auth emails. Supabase only accepts allow-listed URLs. */
function confirmUrl(locale: Locale, next: string): string {
  const url = new URL(`/${locale}/auth/confirm`, siteConfig.url);
  url.searchParams.set("next", next);
  return url.toString();
}

function mapAuthError(
  error: { code?: string; message: string; status?: number },
  context: string,
): AuthErrorCode {
  switch (error.code) {
    case "invalid_credentials":
      return "invalidCredentials";
    case "email_not_confirmed":
      return "emailNotConfirmed";
    case "user_banned":
      return "suspended";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "rateLimited";
    case "weak_password":
      return "weakPassword";
    case "same_password":
      return "samePassword";
    default:
      console.error(`[auth] ${context} failed`, {
        code: error.code,
        status: error.status,
        message: error.message,
      });
      return "generic";
  }
}

export async function signInAction(
  input: unknown,
  localeInput: unknown,
  nextInput: unknown,
): Promise<ActionResult> {
  const locale = localeOf(localeInput);
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { ok: false, error: mapAuthError(error, "sign in") };

  const profile = await getCurrentProfile();
  if (profile?.is_suspended) {
    await supabase.auth.signOut();
    return { ok: false, error: "suspended" };
  }

  redirect(safeNextPath(typeof nextInput === "string" ? nextInput : null, accountHome(locale)));
}

export async function signUpAction(input: unknown): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };
  const { email, password, fullName, phone, preferredLocale } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: confirmUrl(preferredLocale, accountHome(preferredLocale)),
      // Only safe profile fields; the role is always set to customer by the database.
      data: { full_name: fullName, phone, locale: preferredLocale },
    },
  });

  // An existing email returns success without sending (no account enumeration).
  if (error && error.code !== "user_already_exists") {
    const code = mapAuthError(error, "sign up");
    if (code === "weakPassword") return { ok: false, fieldErrors: { password: "passwordMin" } };
    return { ok: false, error: code };
  }
  return { ok: true };
}

export async function resendConfirmationAction(
  emailInput: unknown,
  localeInput: unknown,
): Promise<ActionResult> {
  const locale = localeOf(localeInput);
  const parsed = forgotPasswordSchema.safeParse({ email: emailInput });
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
    options: { emailRedirectTo: confirmUrl(locale, accountHome(locale)) },
  });
  if (error) {
    const code = mapAuthError(error, "resend confirmation");
    if (code === "rateLimited") return { ok: false, error: code };
  }
  // Same answer whether or not the address has an account.
  return { ok: true };
}

export async function forgotPasswordAction(
  input: unknown,
  localeInput: unknown,
): Promise<ActionResult> {
  const locale = localeOf(localeInput);
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: confirmUrl(locale, `/${locale}/reset-password`),
  });
  if (error) {
    const code = mapAuthError(error, "password reset request");
    if (code === "rateLimited") return { ok: false, error: code };
  }
  return { ok: true };
}

export async function resetPasswordAction(
  input: unknown,
  localeInput: unknown,
): Promise<ActionResult> {
  const locale = localeOf(localeInput);
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createSupabaseServerClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return { ok: false, error: "linkExpired" };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { ok: false, error: mapAuthError(error, "password reset") };

  redirect(`${accountHome(locale)}?status=password-updated`);
}

export async function signOutAction(localeInput: unknown): Promise<void> {
  const locale = localeOf(localeInput);
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect(`/${locale}`);
}

export async function updateProfileAction(input: unknown): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!profile || profile.is_suspended) return { ok: false, error: "notSignedIn" };

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      phone: parsed.data.phone,
      locale: parsed.data.preferredLocale,
    })
    .eq("id", profile.id);
  if (error) {
    console.error("[auth] profile update failed", { userId: profile.id, error: error.message });
    return { ok: false, error: "generic" };
  }
  return { ok: true };
}

export async function changePasswordAction(input: unknown): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!profile || profile.is_suspended) return { ok: false, error: "notSignedIn" };

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };

  // Check the current password with a throwaway client so the signed-in session's
  // cookies are untouched.
  const url = publicEnv.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return { ok: false, error: "generic" };
  const verifier = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { error: verifyError } = await verifier.auth.signInWithPassword({
    email: profile.email,
    password: parsed.data.currentPassword,
  });
  if (verifyError) {
    const code = mapAuthError(verifyError, "current password check");
    return code === "invalidCredentials"
      ? { ok: false, error: "wrongCurrentPassword" }
      : { ok: false, error: code };
  }
  await verifier.auth.signOut({ scope: "local" });

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { ok: false, error: mapAuthError(error, "password change") };
  return { ok: true };
}
