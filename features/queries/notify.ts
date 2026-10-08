import "server-only";

import { sendEmail } from "@/lib/email/send";
import { isLocale, type Locale } from "@/lib/i18n/routing";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import {
  acknowledgementEmail,
  adminReplyEmail,
  customerReplyEmail,
  newQueryEmail,
  type QueryEmailData,
} from "./emails";

type Recipient = { email: string; locale: Locale };

/**
 * Who hears about queries: every active Super Admin (in their own language) plus the
 * extra addresses in admin settings (English). De-duplicated by email.
 */
export async function adminRecipients(): Promise<Recipient[]> {
  const admin = createSupabaseAdminClient();
  const [{ data: admins, error: adminsError }, { data: settings }] = await Promise.all([
    admin
      .from("profiles")
      .select("email, locale")
      .eq("role", "superadmin")
      .eq("is_suspended", false),
    admin.from("admin_settings").select("notification_recipients").eq("id", true).maybeSingle(),
  ]);
  if (adminsError)
    console.error("[notify] could not load Super Admins", { error: adminsError.message });

  const byEmail = new Map<string, Recipient>();
  for (const row of admins ?? []) {
    if (row.email) byEmail.set(row.email.toLowerCase(), { email: row.email, locale: row.locale });
  }
  for (const email of settings?.notification_recipients ?? []) {
    const key = email.trim().toLowerCase();
    if (key && !byEmail.has(key)) byEmail.set(key, { email: key, locale: "en" });
  }
  return [...byEmail.values()];
}

async function acknowledgementText(locale: Locale): Promise<string> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("admin_settings")
    .select("auto_ack_en, auto_ack_ur")
    .eq("id", true)
    .maybeSingle();
  return (locale === "ur" ? data?.auto_ack_ur : data?.auto_ack_en) ?? "";
}

/** New query: email the team, and acknowledge the sender in their language. */
export async function notifyNewQuery(
  query: QueryEmailData & { locale: Locale; hasAccount: boolean },
): Promise<void> {
  const [recipients, ackText] = await Promise.all([
    adminRecipients(),
    acknowledgementText(query.locale),
  ]);

  const adminSends = recipients.map(async (recipient) => {
    const email = await newQueryEmail(query, recipient.locale);
    return sendEmail({ ...email, to: recipient.email });
  });
  const ack = acknowledgementEmail(query, query.locale, {
    ackText,
    hasAccount: query.hasAccount,
  }).then((email) => sendEmail({ ...email, to: query.email }));

  const results = await Promise.allSettled([...adminSends, ack]);
  for (const result of results) {
    if (result.status === "rejected") {
      console.error("[notify] new query email failed", {
        reference: query.reference,
        error: String(result.reason),
      });
    }
  }
}

/** A Super Admin replied: email the customer (used by the admin area). */
export async function notifyAdminReply(data: {
  id: string;
  reference: string;
  subject: string;
  reply: string;
  email: string;
  locale: string;
}): Promise<void> {
  const locale = isLocale(data.locale) ? data.locale : "en";
  const email = await adminReplyEmail(data, locale);
  await sendEmail({ ...email, to: data.email });
}

/** The customer replied: email the team (used by the customer portal). */
export async function notifyCustomerReply(data: {
  id: string;
  reference: string;
  name: string;
  reply: string;
  email: string;
}): Promise<void> {
  const recipients = await adminRecipients();
  await Promise.allSettled(
    recipients.map(async (recipient) => {
      const email = await customerReplyEmail(data, recipient.locale);
      return sendEmail({ ...email, to: recipient.email });
    }),
  );
}
