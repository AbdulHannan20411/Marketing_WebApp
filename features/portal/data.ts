import "server-only";

import { z } from "zod";

import type { CurrentProfile } from "@/lib/auth/session";
import type { Database } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Customer portal reads. Every query is scoped to the signed-in customer's id
 * explicitly: RLS lets Super Admins read all queries, so relying on RLS alone would
 * show an admin everyone's queries as "theirs" in the portal. Internal notes are
 * excluded explicitly for the same reason.
 */

type QueryRow = Database["public"]["Tables"]["queries"]["Row"];
export type QueryStatus = Database["public"]["Enums"]["query_status"];

export type PortalQuerySummary = Pick<
  QueryRow,
  "id" | "reference" | "subject" | "topic" | "status" | "last_activity_at" | "created_at"
> & { unread: boolean };

export type PortalMessage = {
  id: string;
  body: string;
  fromTeam: boolean;
  createdAt: string;
  attachments: PortalAttachment[];
};

export type PortalAttachment = {
  id: string;
  fileName: string;
  sizeBytes: number;
  contentType: string;
};

export type PortalQuery = Pick<
  QueryRow,
  | "id"
  | "reference"
  | "subject"
  | "message"
  | "topic"
  | "answers"
  | "status"
  | "created_at"
  | "locale"
> & {
  /** Attachments sent with the original query. */
  attachments: PortalAttachment[];
  messages: PortalMessage[];
  unread: boolean;
};

export const queryIdSchema = z.uuid();

/** A query has an unread reply when the team replied after the customer last looked. */
export function hasUnreadReply(
  row: Pick<QueryRow, "last_admin_reply_at" | "customer_last_read_at">,
): boolean {
  if (!row.last_admin_reply_at) return false;
  if (!row.customer_last_read_at) return true;
  return new Date(row.last_admin_reply_at) > new Date(row.customer_last_read_at);
}

export async function listMyQueries(profile: CurrentProfile): Promise<PortalQuerySummary[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("queries")
    .select(
      "id, reference, subject, topic, status, last_activity_at, created_at, last_admin_reply_at, customer_last_read_at",
    )
    .eq("customer_id", profile.id)
    .order("last_activity_at", { ascending: false })
    .limit(200);
  if (error) {
    console.error("[portal] list failed", { userId: profile.id, error: error.message });
    return [];
  }
  return data.map(({ last_admin_reply_at, customer_last_read_at, ...row }) => ({
    ...row,
    unread: hasUnreadReply({ last_admin_reply_at, customer_last_read_at }),
  }));
}

export async function unreadCount(profile: CurrentProfile): Promise<number> {
  const queries = await listMyQueries(profile);
  return queries.filter((query) => query.unread).length;
}

export async function getMyQuery(profile: CurrentProfile, id: string): Promise<PortalQuery | null> {
  if (!queryIdSchema.safeParse(id).success) return null;
  const supabase = await createSupabaseServerClient();

  const { data: query, error } = await supabase
    .from("queries")
    .select(
      "id, reference, subject, message, topic, answers, status, created_at, locale, last_admin_reply_at, customer_last_read_at",
    )
    .eq("id", id)
    .eq("customer_id", profile.id)
    .maybeSingle();
  if (error) console.error("[portal] query lookup failed", { id, error: error.message });
  if (!query) return null;

  const [{ data: messages }, { data: attachments }] = await Promise.all([
    supabase
      .from("query_messages")
      .select("id, body, author_role, created_at")
      .eq("query_id", id)
      .eq("is_internal", false)
      .order("created_at", { ascending: true }),
    supabase
      .from("query_attachments")
      .select("id, message_id, file_name, size_bytes, content_type, query_messages(is_internal)")
      .eq("query_id", id)
      .order("created_at", { ascending: true }),
  ]);

  const visibleAttachments = (attachments ?? []).filter((attachment) => {
    const parent = attachment.query_messages as { is_internal: boolean } | null;
    return !parent?.is_internal;
  });
  const toAttachment = (row: (typeof visibleAttachments)[number]): PortalAttachment => ({
    id: row.id,
    fileName: row.file_name,
    sizeBytes: row.size_bytes,
    contentType: row.content_type,
  });

  const { last_admin_reply_at, customer_last_read_at, ...fields } = query;
  return {
    ...fields,
    unread: hasUnreadReply({ last_admin_reply_at, customer_last_read_at }),
    attachments: visibleAttachments.filter((row) => !row.message_id).map(toAttachment),
    messages: (messages ?? []).map((message) => ({
      id: message.id,
      body: message.body,
      fromTeam: message.author_role === "superadmin",
      createdAt: message.created_at,
      attachments: visibleAttachments
        .filter((row) => row.message_id === message.id)
        .map(toAttachment),
    })),
  };
}
