import { describe, expect, it } from "vitest";

import { hasUnreadReply } from "@/features/portal/data";

describe("hasUnreadReply", () => {
  it("is unread when the team replied after the customer last looked", () => {
    expect(
      hasUnreadReply({
        last_admin_reply_at: "2026-10-09T10:00:00Z",
        customer_last_read_at: "2026-10-09T09:00:00Z",
      }),
    ).toBe(true);
  });

  it("is unread when the customer has never opened a query with a reply", () => {
    expect(
      hasUnreadReply({ last_admin_reply_at: "2026-10-09T10:00:00Z", customer_last_read_at: null }),
    ).toBe(true);
  });

  it("is read once opened after the reply, or when there is no reply", () => {
    expect(
      hasUnreadReply({
        last_admin_reply_at: "2026-10-09T10:00:00Z",
        customer_last_read_at: "2026-10-09T10:05:00Z",
      }),
    ).toBe(false);
    expect(hasUnreadReply({ last_admin_reply_at: null, customer_last_read_at: null })).toBe(false);
  });
});
