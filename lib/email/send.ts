import "server-only";

import { Resend } from "resend";

import { serverEnv } from "@/lib/env/server";

export type EmailMessage = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

let client: Resend | null = null;

/**
 * Sends an email with Resend. Without RESEND_API_KEY and EMAIL_FROM it logs the email
 * to the server console instead (development), so nothing fails for lack of keys.
 * Never throws: email problems are logged, not shown to visitors.
 */
export async function sendEmail(message: EmailMessage): Promise<{ sent: boolean }> {
  const recipients = Array.isArray(message.to) ? message.to : [message.to];
  if (recipients.length === 0) return { sent: false };

  const apiKey = serverEnv.RESEND_API_KEY;
  const from = serverEnv.EMAIL_FROM;
  if (!apiKey || !from) {
    console.info(
      [
        "[email] RESEND_API_KEY or EMAIL_FROM not set; logging instead of sending.",
        `  To: ${recipients.join(", ")}`,
        `  Subject: ${message.subject}`,
        ...message.text.split("\n").map((line) => `  | ${line}`),
      ].join("\n"),
    );
    return { sent: false };
  }

  try {
    client ??= new Resend(apiKey);
    const { error } = await client.emails.send({
      from,
      to: recipients,
      subject: message.subject,
      html: message.html,
      text: message.text,
      replyTo: message.replyTo,
    });
    if (error) {
      console.error("[email] Resend rejected the message", {
        subject: message.subject,
        error: error.message,
      });
      return { sent: false };
    }
    return { sent: true };
  } catch (error) {
    console.error("[email] sending failed", { subject: message.subject, error: String(error) });
    return { sent: false };
  }
}
