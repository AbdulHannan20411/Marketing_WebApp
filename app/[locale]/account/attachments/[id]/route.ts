import { NextResponse, type NextRequest } from "next/server";

import { queryIdSchema } from "@/features/portal/data";
import { signInPath } from "@/lib/auth/redirects";
import { getCurrentProfile } from "@/lib/auth/session";
import { isLocale } from "@/lib/i18n/routing";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const SIGNED_URL_SECONDS = 60;

/**
 * Downloads a query attachment for its owner: checks the signed-in customer owns the
 * query and the file is not on an internal note, then redirects to a short-lived
 * signed URL for the private bucket. Works as a plain link (no JavaScript needed).
 */
export async function GET(
  request: NextRequest,
  context: RouteContext<"/[locale]/account/attachments/[id]">,
) {
  const { locale: localeParam, id } = await context.params;
  const locale = isLocale(localeParam) ? localeParam : "en";

  const profile = await getCurrentProfile();
  if (!profile || profile.is_suspended) {
    const signIn = new URL(signInPath(locale), request.url);
    signIn.searchParams.set("next", `/${locale}/account`);
    return NextResponse.redirect(signIn);
  }
  if (!queryIdSchema.safeParse(id).success) return new NextResponse(null, { status: 404 });

  const supabase = await createSupabaseServerClient();
  const { data: attachment } = await supabase
    .from("query_attachments")
    .select("storage_path, file_name, queries!inner(customer_id), query_messages(is_internal)")
    .eq("id", id)
    .maybeSingle();

  const owner = (attachment?.queries as { customer_id: string | null } | null)?.customer_id;
  const internal = (attachment?.query_messages as { is_internal: boolean } | null)?.is_internal;
  if (!attachment || owner !== profile.id || internal) {
    return new NextResponse(null, { status: 404 });
  }

  const { data, error } = await createSupabaseAdminClient()
    .storage.from("query-attachments")
    .createSignedUrl(attachment.storage_path, SIGNED_URL_SECONDS, {
      download: attachment.file_name,
    });
  if (error || !data) {
    console.error("[portal] signed URL failed", { id, error: error?.message });
    return new NextResponse(null, { status: 500 });
  }

  const response = NextResponse.redirect(data.signedUrl);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
