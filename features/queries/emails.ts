import "server-only";

import { getTranslations } from "next-intl/server";

import { renderEmail } from "@/lib/email/layout";
import type { EmailMessage } from "@/lib/email/send";
import type { Locale } from "@/lib/i18n/routing";
import { siteConfig } from "@/lib/site";

import { labelAnswers, topicLabel } from "./answer-labels";
import type { Topic } from "./definitions";

/**
 * The four query emails, each with HTML and plain text, in the recipient's locale.
 * All user-written content is escaped by renderEmail.
 */

export type QueryEmailData = {
  id: string;
  reference: string;
  name: string;
  email: string;
  phone: string | null;
  topic: Topic;
  answers: Record<string, unknown>;
  subject: string;
  message: string;
  hasAttachment: boolean;
};

const absolute = (path: string) => new URL(path, siteConfig.url).toString();

export const adminQueryUrl = (locale: Locale, id: string) =>
  absolute(`/${locale}/admin/queries/${id}`);
export const accountQueryUrl = (locale: Locale, id: string) =>
  absolute(`/${locale}/account/queries/${id}`);

/** To Super Admins and extra recipients: a new query with its structured answers. */
export async function newQueryEmail(
  query: QueryEmailData,
  locale: Locale,
): Promise<Omit<EmailMessage, "to">> {
  const [t, footer, topic, answers] = await Promise.all([
    getTranslations({ locale, namespace: "emails.newQuery" }),
    getTranslations({ locale, namespace: "emails" }),
    topicLabel(query.topic, locale),
    labelAnswers(query.topic, query.answers, locale),
  ]);
  const { html, text } = renderEmail({
    locale,
    preheader: t("preheader", { name: query.name, topic }),
    heading: t("heading", { name: query.name }),
    paragraphs: [t("intro")],
    details: [
      { label: t("reference"), value: query.reference },
      { label: t("topic"), value: topic },
      ...answers.map((answer) => ({ label: answer.label, value: answer.values.join(", ") })),
      {
        label: t("from"),
        value: [query.name, query.email, query.phone].filter(Boolean).join("\n"),
      },
      ...(query.hasAttachment ? [{ label: t("attachment"), value: t("yes") }] : []),
    ],
    quote: { label: `${t("message")}: ${query.subject}`, body: query.message },
    cta: { label: t("cta"), url: adminQueryUrl(locale, query.id) },
    footer: footer("footer"),
  });
  return {
    subject: t("subject", { reference: query.reference, subject: query.subject.slice(0, 80) }),
    html,
    text,
    replyTo: query.email,
  };
}

/** To the sender: confirmation with the reference and the configured acknowledgement. */
export async function acknowledgementEmail(
  query: QueryEmailData,
  locale: Locale,
  options: { ackText: string; hasAccount: boolean },
): Promise<Omit<EmailMessage, "to">> {
  const [t, footer] = await Promise.all([
    getTranslations({ locale, namespace: "emails.acknowledgement" }),
    getTranslations({ locale, namespace: "emails" }),
  ]);
  const signUpUrl = new URL(`/${locale}/sign-up`, siteConfig.url);
  signUpUrl.searchParams.set("email", query.email);

  const { html, text } = renderEmail({
    locale,
    preheader: t("preheader", { reference: query.reference }),
    heading: t("heading"),
    paragraphs: [
      ...(options.ackText.trim() ? [options.ackText.trim()] : []),
      options.hasAccount ? t("accountBody") : t("signUpBody"),
    ],
    details: [
      { label: t("reference"), value: query.reference },
      { label: t("subjectLabel"), value: query.subject },
    ],
    quote: { label: t("message"), body: query.message },
    cta: options.hasAccount
      ? { label: t("accountCta"), url: accountQueryUrl(locale, query.id) }
      : { label: t("signUpCta"), url: signUpUrl.toString() },
    footer: footer("footer"),
  });
  return { subject: t("subject", { reference: query.reference }), html, text };
}

/** To the customer: a Super Admin replied (wired up in the admin area). */
export async function adminReplyEmail(
  data: { id: string; reference: string; subject: string; reply: string },
  locale: Locale,
): Promise<Omit<EmailMessage, "to">> {
  const [t, footer] = await Promise.all([
    getTranslations({ locale, namespace: "emails.adminReply" }),
    getTranslations({ locale, namespace: "emails" }),
  ]);
  const { html, text } = renderEmail({
    locale,
    preheader: t("preheader", { reference: data.reference }),
    heading: t("heading"),
    paragraphs: [t("intro", { subject: data.subject })],
    quote: { label: t("reply"), body: data.reply },
    cta: { label: t("cta"), url: accountQueryUrl(locale, data.id) },
    footer: footer("footer"),
  });
  return { subject: t("subject", { reference: data.reference }), html, text };
}

/** To Super Admins: the customer replied (wired up in the customer portal). */
export async function customerReplyEmail(
  data: { id: string; reference: string; name: string; reply: string; email: string },
  locale: Locale,
): Promise<Omit<EmailMessage, "to">> {
  const [t, footer] = await Promise.all([
    getTranslations({ locale, namespace: "emails.customerReply" }),
    getTranslations({ locale, namespace: "emails" }),
  ]);
  const { html, text } = renderEmail({
    locale,
    preheader: t("preheader", { name: data.name }),
    heading: t("heading", { name: data.name, reference: data.reference }),
    paragraphs: [],
    quote: { label: t("reply"), body: data.reply },
    cta: { label: t("cta"), url: adminQueryUrl(locale, data.id) },
    footer: footer("footer"),
  });
  return { subject: t("subject", { reference: data.reference }), html, text, replyTo: data.email };
}
