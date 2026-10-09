import { NextResponse, type NextRequest } from "next/server";

import { idSchema } from "@/features/admin/data";
import { signInPath } from "@/lib/auth/redirects";
import { getCurrentProfile } from "@/lib/auth/session";
import { isLocale } from "@/lib/i18n/routing";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const SIGNED_URL_SECONDS = 60;

/**
 * Downloads any query attachment for an active Super Admin through a short-lived
 * signed URL. The signed URL is created as the admin (not the service role), so the
 * storage policy checks the role again.
 */
export async function GET(
  request: NextRequest,
  context: RouteContext<"/[locale]/admin/attachments/[id]">,
) {
  const { locale: localeParam, id } = await context.params;
  const locale = isLocale(localeParam) ? localeParam : "en";

  const profile = await getCurrentProfile();
  if (!profile) {
    const signIn = new URL(signInPath(locale), request.url);
    signIn.searchParams.set("next", `/${locale}/admin`);
    return NextResponse.redirect(signIn);
  }
  if (profile.role !== "superadmin" || profile.is_suspended || !idSchema.safeParse(id).success) {
    return new NextResponse(null, { status: 404 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: attachment } = await supabase
    .from("query_attachments")
    .select("storage_path, file_name")
    .eq("id", id)
    .maybeSingle();
  if (!attachment) return new NextResponse(null, { status: 404 });

  const { data, error } = await supabase.storage
    .from("query-attachments")
    .createSignedUrl(attachment.storage_path, SIGNED_URL_SECONDS, {
      download: attachment.file_name,
    });
  if (error || !data) {
    console.error("[admin] signed URL failed", { id, error: error?.message });
    return new NextResponse(null, { status: 500 });
  }

  const response = NextResponse.redirect(data.signedUrl);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
