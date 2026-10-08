import { NextResponse, type NextRequest } from "next/server";

import { signInPath } from "@/lib/auth/redirects";
import { isLocale } from "@/lib/i18n/routing";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Signs the user out and returns to sign-in. Used when a suspended account is
 * detected while rendering (Server Components cannot clear cookies themselves).
 * Normal sign-out uses the signOutAction server action.
 */
export async function GET(request: NextRequest, context: RouteContext<"/[locale]/auth/sign-out">) {
  const { locale: localeParam } = await context.params;
  const locale = isLocale(localeParam) ? localeParam : "en";
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  const reason =
    request.nextUrl.searchParams.get("reason") === "suspended" ? "suspended" : "signed-out";
  return NextResponse.redirect(new URL(`${signInPath(locale)}?error=${reason}`, request.url));
}
