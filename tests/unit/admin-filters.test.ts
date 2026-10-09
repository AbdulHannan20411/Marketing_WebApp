import { describe, expect, it } from "vitest";

import {
  fillSavedReply,
  inboxSearch,
  parseInboxFilters,
  pktDayEnd,
  pktDayStart,
  sanitizeSearch,
  splitDuration,
} from "@/features/admin/filters";

const ID = "3f2b8c1e-5d4a-4b6f-9c7e-1a2b3c4d5e6f";

describe("parseInboxFilters", () => {
  it("defaults to everything, newest activity first, page 1", () => {
    expect(parseInboxFilters({})).toEqual({
      q: "",
      status: null,
      topic: null,
      assignee: null,
      customer: null,
      from: null,
      to: null,
      sort: "activity_desc",
      page: 1,
    });
  });

  it("keeps valid values", () => {
    expect(
      parseInboxFilters({
        q: " invoice ",
        status: "awaiting_customer",
        topic: "billing",
        assignee: "me",
        customer: ID,
        from: "2026-10-01",
        to: "2026-10-09",
        sort: "created_asc",
        page: "3",
      }),
    ).toMatchObject({
      q: "invoice",
      status: "awaiting_customer",
      topic: "billing",
      assignee: "me",
      customer: ID,
      from: "2026-10-01",
      to: "2026-10-09",
      sort: "created_asc",
      page: 3,
    });
  });

  it("drops malformed values instead of failing", () => {
    expect(
      parseInboxFilters({
        status: "deleted",
        topic: "spam",
        assignee: "someone",
        customer: "not-a-uuid",
        from: "2026-02-30",
        to: "yesterday",
        sort: "random",
        page: "-4",
      }),
    ).toMatchObject({
      status: null,
      topic: null,
      assignee: null,
      customer: null,
      from: null,
      to: null,
      sort: "activity_desc",
      page: 1,
    });
  });

  it("uses the first value when a parameter repeats", () => {
    expect(parseInboxFilters({ status: ["open", "closed"] }).status).toBe("open");
  });
});

describe("sanitizeSearch", () => {
  it("removes filter syntax characters and limits the length", () => {
    expect(sanitizeSearch("a,b)(c\"d'e*f%g\\h:i")).toBe("a b c d e f g h i");
    expect(sanitizeSearch("x".repeat(300))).toHaveLength(100);
  });

  it("keeps emails and references searchable", () => {
    expect(sanitizeSearch("ali@shop.pk")).toBe("ali@shop.pk");
    expect(sanitizeSearch("NR-2026-00042")).toBe("NR-2026-00042");
  });
});

describe("inboxSearch", () => {
  it("leaves defaults out of the URL", () => {
    expect(inboxSearch({ sort: "activity_desc", page: 1 })).toBe("");
    expect(inboxSearch({ status: "new", page: 2 })).toBe("?status=new&page=2");
  });

  it("round-trips through parseInboxFilters", () => {
    const filters = parseInboxFilters({ q: "demo", topic: "demo", assignee: "none", page: "2" });
    const params = Object.fromEntries(new URLSearchParams(inboxSearch(filters)));
    expect(parseInboxFilters(params)).toEqual(filters);
  });
});

describe("Pakistan-time day boundaries", () => {
  it("starts at midnight PKT (UTC+5) and ends at the next midnight", () => {
    expect(pktDayStart("2026-10-09")).toBe("2026-10-08T19:00:00.000Z");
    expect(pktDayEnd("2026-10-09")).toBe("2026-10-09T19:00:00.000Z");
  });
});

describe("splitDuration", () => {
  it("picks sensible units", () => {
    expect(splitDuration(20)).toEqual({ unit: "minutes", minutes: 1 });
    expect(splitDuration(45 * 60)).toEqual({ unit: "minutes", minutes: 45 });
    expect(splitDuration(3 * 3600 + 5 * 60)).toEqual({ unit: "hours", hours: 3, minutes: 5 });
    expect(splitDuration(2 * 86400 + 4 * 3600)).toEqual({ unit: "days", days: 2, hours: 4 });
  });
});

describe("fillSavedReply", () => {
  it("fills every [name] and [reference]", () => {
    expect(
      fillSavedReply("Hi [name], about [reference]. Thanks [name]!", {
        name: "Ayesha",
        reference: "NR-2026-00042",
      }),
    ).toBe("Hi Ayesha, about NR-2026-00042. Thanks Ayesha!");
  });
});
