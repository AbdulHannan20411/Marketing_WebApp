import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { accountHome, safeNextPath, signInPath } from "@/lib/auth/redirects";
import { isLocale } from "@/lib/i18n/routing";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const OTP_TYPES: EmailOtpType[] = [
  "signup",
  "email",
  "recovery",
  "invite",
  "magiclink",
  "email_change",
];

/**
 * Landing point for links in auth emails (sign-up confirmation, password reset).
 * Accepts both forms:
 *   ?token_hash=…&type=…  (branded templates; works on any device)
 *   ?code=…               (Supabase default template, PKCE; same browser)
 * Confirming the email also links earlier signed-out queries (database trigger).
 */
export async function GET(request: NextRequest, context: RouteContext<"/[locale]/auth/confirm">) {
  const { locale: localeParam } = await context.params;
  const locale = isLocale(localeParam) ? localeParam : "en";
  const params = request.nextUrl.searchParams;
  const next = safeNextPath(params.get("next"), accountHome(locale));
  const failure = new URL(`${signInPath(locale)}?error=link`, request.url);

  const supabase = await createSupabaseServerClient();
  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;
  const code = params.get("code");

  if (tokenHash && type && OTP_TYPES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(next, request.url));
    console.error("[auth] email link verification failed", { type, code: error.code });
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, request.url));
    console.error("[auth] code exchange failed", { code: error.code });
  }

  return NextResponse.redirect(failure);
}
