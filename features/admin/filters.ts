import { topicKeys, type Topic } from "@/features/queries/definitions";

/**
 * Inbox filters, read from the URL so filtered views can be bookmarked and shared.
 * Anything malformed is dropped rather than rejected.
 */

export const queryStatuses = ["new", "open", "awaiting_customer", "resolved", "closed"] as const;
export type QueryStatus = (typeof queryStatuses)[number];

export const inboxSorts = ["activity_desc", "activity_asc", "created_desc", "created_asc"] as const;
export type InboxSort = (typeof inboxSorts)[number];

export const INBOX_PAGE_SIZE = 25;

export type InboxFilters = {
  q: string;
  status: QueryStatus | null;
  topic: Topic | null;
  /** "me", "none" or a Super Admin's id. */
  assignee: string | null;
  /** Only queries from this customer account. */
  customer: string | null;
  /** Inclusive dates (YYYY-MM-DD), in Pakistan time. */
  from: string | null;
  to: string | null;
  sort: InboxSort;
  page: number;
};

type SearchParams = Record<string, string | string[] | undefined>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const first = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value)?.trim() ?? "";

const oneOf = <T extends string>(list: readonly T[], value: string): T | null =>
  (list as readonly string[]).includes(value) ? (value as T) : null;

function validDate(value: string): string | null {
  if (!DATE.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : value;
}

/**
 * Keeps search text safe to embed in a PostgREST `or` filter: drops the characters
 * that filter syntax uses (commas, parentheses, quotes, wildcards, backslashes).
 */
export function sanitizeSearch(value: string): string {
  return value
    .replace(/[,()"'*%\\:]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}

export function parseInboxFilters(params: SearchParams): InboxFilters {
  const assignee = first(params.assignee);
  const customer = first(params.customer);
  const page = Number.parseInt(first(params.page), 10);
  return {
    q: sanitizeSearch(first(params.q)),
    status: oneOf(queryStatuses, first(params.status)),
    topic: oneOf(topicKeys, first(params.topic)),
    assignee: assignee === "me" || assignee === "none" || UUID.test(assignee) ? assignee : null,
    customer: UUID.test(customer) ? customer : null,
    from: validDate(first(params.from)),
    to: validDate(first(params.to)),
    sort: oneOf(inboxSorts, first(params.sort)) ?? "activity_desc",
    page: Number.isFinite(page) && page > 0 ? Math.min(page, 10_000) : 1,
  };
}

/** Start of a Pakistan-time day, and the start of the day after, as ISO timestamps. */
export function pktDayStart(date: string): string {
  return new Date(`${date}T00:00:00+05:00`).toISOString();
}
export function pktDayEnd(date: string): string {
  return new Date(new Date(`${date}T00:00:00+05:00`).getTime() + 86_400_000).toISOString();
}

/** The URL search string for a set of filters (defaults are left out). */
export function inboxSearch(filters: Partial<InboxFilters>): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.status) params.set("status", filters.status);
  if (filters.topic) params.set("topic", filters.topic);
  if (filters.assignee) params.set("assignee", filters.assignee);
  if (filters.customer) params.set("customer", filters.customer);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.sort && filters.sort !== "activity_desc") params.set("sort", filters.sort);
  if (filters.page && filters.page > 1) params.set("page", String(filters.page));
  const search = params.toString();
  return search ? `?${search}` : "";
}

/** Splits a duration into the largest sensible units for display. */
export function splitDuration(
  totalSeconds: number,
):
  | { unit: "minutes"; minutes: number }
  | { unit: "hours"; hours: number; minutes: number }
  | { unit: "days"; days: number; hours: number } {
  const minutes = Math.max(1, Math.round(totalSeconds / 60));
  if (minutes < 60) return { unit: "minutes", minutes };
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return { unit: "hours", hours, minutes: minutes % 60 };
  return { unit: "days", days: Math.floor(hours / 24), hours: hours % 24 };
}

/** Fills a saved reply's [name] and [reference] placeholders. */
export function fillSavedReply(body: string, values: { name: string; reference: string }): string {
  return body.replaceAll("[name]", values.name).replaceAll("[reference]", values.reference);
}
