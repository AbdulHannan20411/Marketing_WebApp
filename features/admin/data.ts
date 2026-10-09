import "server-only";

import { z } from "@/lib/validation/zod";

import type { Topic } from "@/features/queries/definitions";
import type { CurrentProfile } from "@/lib/auth/session";
import type { Database, Json } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  INBOX_PAGE_SIZE,
  pktDayEnd,
  pktDayStart,
  queryStatuses,
  sanitizeSearch,
  type InboxFilters,
  type QueryStatus,
} from "./filters";

/**
 * Super Admin reads. They run as the signed-in user, so RLS applies; callers have
 * already checked the role with requireSuperadmin().
 */

type Tables = Database["public"]["Tables"];
type QueryRow = Tables["queries"]["Row"];
export type EventType = Database["public"]["Enums"]["query_event_type"];

export const idSchema = z.uuid();

export type TeamMember = { id: string; name: string };

const displayName = (row: { full_name: string | null; email: string | null } | null) =>
  row?.full_name?.trim() || row?.email || "";

/** Every active Super Admin, for assignment. */
export async function listTeam(): Promise<TeamMember[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "superadmin")
    .eq("is_suspended", false)
    .order("full_name", { ascending: true });
  if (error) console.error("[admin] team lookup failed", { error: error.message });
  return (data ?? []).map((row) => ({ id: row.id, name: displayName(row) }));
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

const statsSchema = z.object({
  by_status: z.record(z.string(), z.number()),
  by_topic: z.record(z.string(), z.number()),
  new_this_week: z.number(),
  avg_first_response_seconds: z.number().nullable(),
  responded_last_30_days: z.number(),
});

export type DashboardStats = {
  byStatus: Record<QueryStatus, number>;
  byTopic: Partial<Record<Topic, number>>;
  total: number;
  newThisWeek: number;
  avgFirstResponseSeconds: number | null;
  respondedLast30Days: number;
};

export type WaitingQuery = Pick<
  QueryRow,
  "id" | "reference" | "subject" | "name" | "status" | "topic" | "last_activity_at"
>;

export async function getDashboardStats(): Promise<DashboardStats | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("admin_query_stats");
  const parsed = statsSchema.safeParse(data);
  if (error || !parsed.success) {
    console.error("[admin] stats failed", { error: error?.message ?? parsed.error?.message });
    return null;
  }
  const stats = parsed.data;
  const byStatus = Object.fromEntries(
    queryStatuses.map((status) => [status, stats.by_status[status] ?? 0]),
  ) as Record<QueryStatus, number>;
  return {
    byStatus,
    byTopic: stats.by_topic as Partial<Record<Topic, number>>,
    total: Object.values(byStatus).reduce((sum, n) => sum + n, 0),
    newThisWeek: stats.new_this_week,
    avgFirstResponseSeconds: stats.avg_first_response_seconds,
    respondedLast30Days: stats.responded_last_30_days,
  };
}

/** New and open queries (the customer is waiting on us), oldest activity first. */
export async function listWaiting(limit = 6): Promise<WaitingQuery[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("queries")
    .select("id, reference, subject, name, status, topic, last_activity_at")
    .in("status", ["new", "open"])
    .order("last_activity_at", { ascending: true })
    .limit(limit);
  if (error) console.error("[admin] waiting list failed", { error: error.message });
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Inbox
// ---------------------------------------------------------------------------

export type InboxRow = Pick<
  QueryRow,
  | "id"
  | "reference"
  | "subject"
  | "name"
  | "email"
  | "topic"
  | "status"
  | "assignee_id"
  | "last_activity_at"
  | "created_at"
>;

export type InboxPage = { rows: InboxRow[]; total: number; failed: boolean };

export async function listInbox(filters: InboxFilters, me: CurrentProfile): Promise<InboxPage> {
  const supabase = await createSupabaseServerClient();
  let request = supabase
    .from("queries")
    .select(
      "id, reference, subject, name, email, topic, status, assignee_id, last_activity_at, created_at",
      { count: "exact" },
    );

  if (filters.status) request = request.eq("status", filters.status);
  if (filters.topic) request = request.eq("topic", filters.topic);
  if (filters.assignee === "me") request = request.eq("assignee_id", me.id);
  else if (filters.assignee === "none") request = request.is("assignee_id", null);
  else if (filters.assignee) request = request.eq("assignee_id", filters.assignee);
  if (filters.customer) request = request.eq("customer_id", filters.customer);
  if (filters.from) request = request.gte("created_at", pktDayStart(filters.from));
  if (filters.to) request = request.lt("created_at", pktDayEnd(filters.to));

  const q = sanitizeSearch(filters.q);
  if (q) {
    const pattern = `%${q}%`;
    request = request.or(
      ["subject", "message", "email", "reference"]
        .map((column) => `${column}.ilike.${pattern}`)
        .join(","),
    );
  }

  const [column, direction] =
    filters.sort === "activity_asc"
      ? (["last_activity_at", true] as const)
      : filters.sort === "created_desc"
        ? (["created_at", false] as const)
        : filters.sort === "created_asc"
          ? (["created_at", true] as const)
          : (["last_activity_at", false] as const);

  const start = (filters.page - 1) * INBOX_PAGE_SIZE;
  const { data, count, error } = await request
    .order(column, { ascending: direction })
    .order("id", { ascending: true })
    .range(start, start + INBOX_PAGE_SIZE - 1);

  if (error) {
    // Asking for a page past the end is an error in PostgREST; treat it as empty.
    if (error.code === "PGRST103") return { rows: [], total: count ?? 0, failed: false };
    console.error("[admin] inbox failed", { error: error.message });
    return { rows: [], total: 0, failed: true };
  }
  return { rows: data ?? [], total: count ?? 0, failed: false };
}

// ---------------------------------------------------------------------------
// Query detail
// ---------------------------------------------------------------------------

export type AdminAttachment = {
  id: string;
  fileName: string;
  sizeBytes: number;
  messageId: string | null;
};

export type AdminMessage = {
  id: string;
  body: string;
  authorRole: Database["public"]["Enums"]["message_author_role"];
  authorName: string;
  isInternal: boolean;
  createdAt: string;
  attachments: AdminAttachment[];
};

export type AdminEvent = {
  id: string;
  type: EventType;
  actorName: string | null;
  data: Record<string, Json | undefined>;
  createdAt: string;
};

export type AdminQuery = Pick<
  QueryRow,
  | "id"
  | "reference"
  | "customer_id"
  | "name"
  | "email"
  | "phone"
  | "topic"
  | "answers"
  | "subject"
  | "message"
  | "status"
  | "assignee_id"
  | "locale"
  | "source"
  | "utm"
  | "created_at"
  | "last_activity_at"
  | "first_response_at"
> & {
  customer: { id: string; isSuspended: boolean } | null;
  attachments: AdminAttachment[];
  messages: AdminMessage[];
  events: AdminEvent[];
};

export async function getAdminQuery(id: string): Promise<AdminQuery | null> {
  if (!idSchema.safeParse(id).success) return null;
  const supabase = await createSupabaseServerClient();

  const { data: query, error } = await supabase
    .from("queries")
    .select(
      "id, reference, customer_id, name, email, phone, topic, answers, subject, message, status, assignee_id, locale, source, utm, created_at, last_activity_at, first_response_at",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) console.error("[admin] query lookup failed", { id, error: error.message });
  if (!query) return null;

  const [messages, attachments, events, customer] = await Promise.all([
    supabase
      .from("query_messages")
      .select("id, body, author_role, is_internal, created_at, profiles(full_name, email)")
      .eq("query_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("query_attachments")
      .select("id, message_id, file_name, size_bytes")
      .eq("query_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("query_events")
      .select("id, type, data, created_at, profiles(full_name, email)")
      .eq("query_id", id)
      .order("created_at", { ascending: false })
      .limit(100),
    query.customer_id
      ? supabase
          .from("profiles")
          .select("id, is_suspended")
          .eq("id", query.customer_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const files: AdminAttachment[] = (attachments.data ?? []).map((row) => ({
    id: row.id,
    fileName: row.file_name,
    sizeBytes: row.size_bytes,
    messageId: row.message_id,
  }));

  return {
    ...query,
    customer: customer.data
      ? { id: customer.data.id, isSuspended: customer.data.is_suspended }
      : null,
    attachments: files.filter((file) => !file.messageId),
    messages: (messages.data ?? []).map((message) => ({
      id: message.id,
      body: message.body,
      authorRole: message.author_role,
      authorName: displayName(message.profiles),
      isInternal: message.is_internal,
      createdAt: message.created_at,
      attachments: files.filter((file) => file.messageId === message.id),
    })),
    events: (events.data ?? []).map((event) => ({
      id: event.id,
      type: event.type,
      actorName: event.profiles ? displayName(event.profiles) : null,
      data:
        event.data && typeof event.data === "object" && !Array.isArray(event.data)
          ? event.data
          : {},
      createdAt: event.created_at,
    })),
  };
}

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

export const CUSTOMERS_PAGE_SIZE = 25;

export type CustomerRow = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  isSuspended: boolean;
  createdAt: string;
  queryCount: number;
};

export async function listCustomers(options: {
  q: string;
  page: number;
}): Promise<{ rows: CustomerRow[]; total: number; failed: boolean }> {
  const supabase = await createSupabaseServerClient();
  let request = supabase
    .from("profiles")
    .select(
      "id, email, full_name, phone, is_suspended, created_at, queries!queries_customer_id_fkey(count)",
      { count: "exact" },
    )
    .eq("role", "customer");
  const q = sanitizeSearch(options.q);
  if (q) request = request.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);

  const start = (options.page - 1) * CUSTOMERS_PAGE_SIZE;
  const { data, count, error } = await request
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .range(start, start + CUSTOMERS_PAGE_SIZE - 1);
  if (error) {
    if (error.code === "PGRST103") return { rows: [], total: count ?? 0, failed: false };
    console.error("[admin] customers failed", { error: error.message });
    return { rows: [], total: 0, failed: true };
  }
  return {
    total: count ?? 0,
    failed: false,
    rows: (data ?? []).map((row) => ({
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      phone: row.phone,
      isSuspended: row.is_suspended,
      createdAt: row.created_at,
      queryCount: row.queries[0]?.count ?? 0,
    })),
  };
}

export async function getCustomerName(id: string): Promise<string | null> {
  if (!idSchema.safeParse(id).success) return null;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", id)
    .maybeSingle();
  return data ? displayName(data) : null;
}

// ---------------------------------------------------------------------------
// Saved replies and settings
// ---------------------------------------------------------------------------

export type SavedReply = Pick<Tables["saved_replies"]["Row"], "id" | "title" | "body" | "locale">;

export async function listSavedReplies(): Promise<SavedReply[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("saved_replies")
    .select("id, title, body, locale")
    .order("title", { ascending: true });
  if (error) console.error("[admin] saved replies failed", { error: error.message });
  return data ?? [];
}

export type AdminSettings = Pick<
  Tables["admin_settings"]["Row"],
  "notification_recipients" | "auto_ack_en" | "auto_ack_ur"
>;

export async function getAdminSettings(): Promise<AdminSettings | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("admin_settings")
    .select("notification_recipients, auto_ack_en, auto_ack_ur")
    .eq("id", true)
    .maybeSingle();
  if (error) console.error("[admin] settings failed", { error: error.message });
  return data;
}
