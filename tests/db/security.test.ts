import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  as,
  connect,
  createQuery,
  createUser,
  expectDenied,
  makeSuperadmin,
  rollback,
  type Db,
} from "./helpers";

let db: Db;

beforeAll(async () => {
  db = await connect();
});

afterAll(async () => {
  await db?.end();
});

describe("schema hygiene", () => {
  it("has RLS enabled and at least one policy on every public table", async () => {
    const { rows } = await db.query<{ table: string; rls: boolean; policies: number }>(`
      select c.relname as table, c.relrowsecurity as rls,
             (select count(*) from pg_policies p where p.schemaname = 'public' and p.tablename = c.relname)::int as policies
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r'
      order by 1`);
    expect(rows.length).toBeGreaterThanOrEqual(8);
    for (const row of rows) {
      expect(row.rls, `${row.table} RLS`).toBe(true);
      expect(row.policies, `${row.table} policies`).toBeGreaterThan(0);
    }
  });

  it("has a private attachments bucket limited to PNG, JPG and PDF up to 5 MB", async () => {
    const { rows } = await db.query(
      "select public, file_size_limit::int as file_size_limit, allowed_mime_types from storage.buckets where id = 'query-attachments'",
    );
    expect(rows[0]).toEqual({
      public: false,
      file_size_limit: 5242880,
      allowed_mime_types: ["image/png", "image/jpeg", "application/pdf"],
    });
  });

  it("publishes queries and messages for realtime", async () => {
    const { rows } = await db.query(
      "select tablename from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' order by 1",
    );
    expect(rows.map((row) => row.tablename)).toEqual(
      expect.arrayContaining(["queries", "query_messages"]),
    );
  });
});

describe("profiles and roles", () => {
  it("creates a customer profile on sign-up and ignores a role in metadata", () =>
    rollback(db, async () => {
      const user = await createUser(db, {
        meta: { full_name: "Ayesha", locale: "ur", phone: "03001234567", role: "superadmin" },
      });
      const { rows } = await db.query(
        "select role, full_name, locale, phone, email from public.profiles where id = $1",
        [user.id],
      );
      expect(rows[0]).toMatchObject({
        role: "customer",
        full_name: "Ayesha",
        locale: "ur",
        phone: "03001234567",
      });
    }));

  it("never lets a user change their own role, suspension or email", () =>
    rollback(db, async () => {
      const user = await createUser(db);
      await as(db, user.id, async () => {
        expect(
          await expectDenied(db, () =>
            db.query("update public.profiles set role = 'superadmin' where id = $1", [user.id]),
          ),
        ).toBe("42501");
        expect(
          await expectDenied(db, () =>
            db.query("update public.profiles set is_suspended = true where id = $1", [user.id]),
          ),
        ).toBe("42501");
        expect(
          await expectDenied(db, () =>
            db.query("update public.profiles set email = 'x@y.z' where id = $1", [user.id]),
          ),
        ).toBe("42501");
        const ok = await db.query(
          "update public.profiles set full_name = 'New Name', locale = 'ur' where id = $1",
          [user.id],
        );
        expect(ok.rowCount).toBe(1);
      });
    }));

  it("lets users read only their own profile; Super Admins read all", () =>
    rollback(db, async () => {
      const a = await createUser(db);
      const b = await createUser(db);
      const admin = await createUser(db);
      await makeSuperadmin(db, admin.email);
      const seenByA = await as(db, a.id, () =>
        db.query("select id from public.profiles where id in ($1, $2)", [a.id, b.id]),
      );
      expect(seenByA.rows.map((r) => r.id)).toEqual([a.id]);
      const seenByAdmin = await as(db, admin.id, () =>
        db.query("select id from public.profiles where id in ($1, $2)", [a.id, b.id]),
      );
      expect(seenByAdmin.rowCount).toBe(2);
    }));

  it("only the service role can promote someone to Super Admin", () =>
    rollback(db, async () => {
      const user = await createUser(db);
      await as(db, user.id, async () => {
        expect(
          await expectDenied(db, () =>
            db.query("select public.promote_to_superadmin($1)", [user.email]),
          ),
        ).toBe("42501");
      });
      await makeSuperadmin(db, user.email);
      const { rows } = await db.query("select role from public.profiles where id = $1", [user.id]);
      expect(rows[0].role).toBe("superadmin");
    }));

  it("lets Super Admins suspend customers but not other Super Admins", () =>
    rollback(db, async () => {
      const customer = await createUser(db);
      const admin = await createUser(db);
      const otherAdmin = await createUser(db);
      await makeSuperadmin(db, admin.email);
      await makeSuperadmin(db, otherAdmin.email);
      await as(db, customer.id, async () => {
        expect(
          await expectDenied(db, () =>
            db.query("select public.set_customer_suspended($1, true)", [customer.id]),
          ),
        ).toBe("42501");
      });
      const results = await as(db, admin.id, async () => [
        (await db.query("select public.set_customer_suspended($1, true) as ok", [customer.id]))
          .rows[0].ok,
        (await db.query("select public.set_customer_suspended($1, true) as ok", [otherAdmin.id]))
          .rows[0].ok,
      ]);
      expect(results).toEqual([true, false]);
    }));
});

describe("queries", () => {
  it("gives anonymous visitors no direct access", () =>
    rollback(db, async () => {
      await createQuery(db);
      await as(db, null, async () => {
        expect(await expectDenied(db, () => db.query("select * from public.queries"))).toBe(
          "42501",
        );
        expect(
          await expectDenied(db, () =>
            db.query(
              "insert into public.queries (name, email, topic, subject, message) values ('a','a@b.co','other','s','x'::text || repeat('y', 30))",
            ),
          ),
        ).toBe("42501");
      });
    }));

  it("generates NR-YYYY-##### references", () =>
    rollback(db, async () => {
      const query = await createQuery(db);
      expect(query.reference).toMatch(/^NR-\d{4}-\d{5,}$/);
    }));

  it("lets customers create their own query only in its initial state", () =>
    rollback(db, async () => {
      const customer = await createUser(db);
      const other = await createUser(db);
      await as(db, customer.id, async () => {
        const insert = (customerId: string, status = "new") =>
          db.query(
            `insert into public.queries (customer_id, name, email, topic, subject, message, status)
             values ($1, 'Me', 'me@example.com', 'demo', 'Demo please', 'I would like to book a demo for my shop.', $2)`,
            [customerId, status],
          );
        expect((await insert(customer.id)).rowCount).toBe(1);
        expect(await expectDenied(db, () => insert(other.id))).toBe("42501");
        expect(await expectDenied(db, () => insert(customer.id, "open"))).toBe("42501");
      });
    }));

  it("shows customers only their own queries; Super Admins see all", () =>
    rollback(db, async () => {
      const a = await createUser(db);
      const b = await createUser(db);
      const admin = await createUser(db);
      await makeSuperadmin(db, admin.email);
      const qa = await createQuery(db, { customer_id: a.id });
      const qb = await createQuery(db, { customer_id: b.id });
      const seenByA = await as(db, a.id, () =>
        db.query("select id from public.queries where id in ($1, $2)", [qa.id, qb.id]),
      );
      expect(seenByA.rows.map((r) => r.id)).toEqual([qa.id]);
      const seenByAdmin = await as(db, admin.id, () =>
        db.query("select id from public.queries where id in ($1, $2)", [qa.id, qb.id]),
      );
      expect(seenByAdmin.rowCount).toBe(2);
    }));

  it("blocks customers from changing status directly but allows resolving and reading via RPC", () =>
    rollback(db, async () => {
      const customer = await createUser(db);
      const query = await createQuery(db, { customer_id: customer.id });
      await as(db, customer.id, async () => {
        const direct = await db.query("update public.queries set status = 'closed' where id = $1", [
          query.id,
        ]);
        expect(direct.rowCount).toBe(0);
        await db.query("select public.mark_query_read($1)", [query.id]);
        const resolved = await db.query("select public.resolve_my_query($1) as ok", [query.id]);
        expect(resolved.rows[0].ok).toBe(true);
      });
      const { rows } = await db.query(
        "select status, customer_last_read_at from public.queries where id = $1",
        [query.id],
      );
      expect(rows[0].status).toBe("resolved");
      expect(rows[0].customer_last_read_at).not.toBeNull();
    }));

  it("restricts assignment to Super Admins", () =>
    rollback(db, async () => {
      const customer = await createUser(db);
      const admin = await createUser(db);
      await makeSuperadmin(db, admin.email);
      const query = await createQuery(db);
      await as(db, admin.id, async () => {
        expect(
          (
            await db.query("update public.queries set assignee_id = $1 where id = $2", [
              admin.id,
              query.id,
            ])
          ).rowCount,
        ).toBe(1);
        expect(
          await expectDenied(db, () =>
            db.query("update public.queries set assignee_id = $1 where id = $2", [
              customer.id,
              query.id,
            ]),
          ),
        ).toBe("42501");
      });
    }));
});

describe("messages, notes and status automation", () => {
  it("hides internal notes from customers and keeps statuses and timestamps in step", () =>
    rollback(db, async () => {
      const customer = await createUser(db);
      const admin = await createUser(db);
      await makeSuperadmin(db, admin.email);
      const query = await createQuery(db, { customer_id: customer.id });

      await as(db, admin.id, async () => {
        await db.query(
          "insert into public.query_messages (query_id, author_id, author_role, body, is_internal) values ($1, $2, 'superadmin', 'Internal: check payment', true)",
          [query.id, admin.id],
        );
        await db.query(
          "insert into public.query_messages (query_id, author_id, author_role, body) values ($1, $2, 'superadmin', 'Hello! Here is our price list.')",
          [query.id, admin.id],
        );
      });

      let state = (
        await db.query("select status, first_response_at from public.queries where id = $1", [
          query.id,
        ])
      ).rows[0];
      expect(state.status).toBe("awaiting_customer");
      expect(state.first_response_at).not.toBeNull();

      await as(db, customer.id, async () => {
        const visible = await db.query(
          "select body from public.query_messages where query_id = $1",
          [query.id],
        );
        expect(visible.rows.map((r) => r.body)).toEqual(["Hello! Here is our price list."]);
        expect(
          await expectDenied(db, () =>
            db.query(
              "insert into public.query_messages (query_id, author_id, author_role, body, is_internal) values ($1, $2, 'superadmin', 'fake', true)",
              [query.id, customer.id],
            ),
          ),
        ).not.toBe("");
        await db.query(
          "insert into public.query_messages (query_id, author_id, author_role, body) values ($1, $2, 'customer', 'Thanks, one more question.')",
          [query.id, customer.id],
        );
      });

      state = (await db.query("select status from public.queries where id = $1", [query.id]))
        .rows[0];
      expect(state.status).toBe("open");

      const events = await as(db, admin.id, () =>
        db.query(
          "select type from public.query_events where query_id = $1 order by created_at, type",
          [query.id],
        ),
      );
      expect(events.rows.map((r) => r.type)).toEqual(
        expect.arrayContaining([
          "created",
          "note_added",
          "replied",
          "customer_replied",
          "status_changed",
        ]),
      );
    }));

  it("stops customers replying on closed queries, on others' queries, or while suspended", () =>
    rollback(db, async () => {
      const customer = await createUser(db);
      const stranger = await createUser(db);
      const closed = await createQuery(db, { customer_id: customer.id, status: "closed" });
      const open = await createQuery(db, { customer_id: customer.id });
      const reply = (queryId: string, author: string) =>
        db.query(
          "insert into public.query_messages (query_id, author_id, author_role, body) values ($1, $2, 'customer', 'Hello again')",
          [queryId, author],
        );
      await as(db, customer.id, async () => {
        expect(await expectDenied(db, () => reply(closed.id, customer.id))).toBe("42501");
      });
      await as(db, stranger.id, async () => {
        expect(await expectDenied(db, () => reply(open.id, stranger.id))).toBe("42501");
      });
      await db.query("update public.profiles set is_suspended = true where id = $1", [customer.id]);
      await as(db, customer.id, async () => {
        expect(await expectDenied(db, () => reply(open.id, customer.id))).toBe("42501");
      });
    }));

  it("keeps the activity log, saved replies and settings for Super Admins only", () =>
    rollback(db, async () => {
      const customer = await createUser(db);
      const query = await createQuery(db, { customer_id: customer.id });
      await as(db, customer.id, async () => {
        expect(
          (await db.query("select * from public.query_events where query_id = $1", [query.id]))
            .rowCount,
        ).toBe(0);
        expect((await db.query("select * from public.saved_replies")).rowCount).toBe(0);
        expect((await db.query("select * from public.admin_settings")).rowCount).toBe(0);
        expect(
          await expectDenied(db, () =>
            db.query("insert into public.query_events (query_id, type) values ($1, 'created')", [
              query.id,
            ]),
          ),
        ).toBe("42501");
      });
    }));
});

describe("linking signed-out queries", () => {
  it("links queries to an account when its email is confirmed, not before", () =>
    rollback(db, async () => {
      const email = `link-${Date.now()}@example.com`;
      const query = await createQuery(db, { email });
      const user = await createUser(db, { email, confirmed: false });

      let row = (await db.query("select customer_id from public.queries where id = $1", [query.id]))
        .rows[0];
      expect(row.customer_id).toBeNull();

      await db.query("update auth.users set email_confirmed_at = now() where id = $1", [user.id]);
      row = (await db.query("select customer_id from public.queries where id = $1", [query.id]))
        .rows[0];
      expect(row.customer_id).toBe(user.id);

      const events = await db.query(
        "select type from public.query_events where query_id = $1 and type = 'linked_to_account'",
        [query.id],
      );
      expect(events.rowCount).toBe(1);
    }));
});

describe("rate limiting", () => {
  it("allows 5 attempts per window, then refuses", () =>
    rollback(db, async () => {
      const key = `test:${Date.now()}`;
      const results: boolean[] = [];
      for (let i = 0; i < 6; i += 1) {
        results.push(
          (await db.query("select public.hit_rate_limit($1, 5, 3600) as ok", [key])).rows[0].ok,
        );
      }
      expect(results).toEqual([true, true, true, true, true, false]);
    }));

  it("is not callable by clients", () =>
    rollback(db, async () => {
      const user = await createUser(db);
      await as(db, user.id, async () => {
        expect(
          await expectDenied(db, () => db.query("select public.hit_rate_limit('x', 5, 60)")),
        ).toBe("42501");
        expect(await expectDenied(db, () => db.query("select * from public.rate_limits"))).toBe(
          "42501",
        );
      });
    }));
});

describe("admin dashboard stats", () => {
  it("counts by status and topic, new this week and the first-response time", () =>
    rollback(db, async () => {
      const admin = await createUser(db);
      await makeSuperadmin(db, admin.email);
      const before = await as(
        db,
        admin.id,
        async () => (await db.query("select public.admin_query_stats() as s")).rows[0].s,
      );

      const answered = await createQuery(db);
      await createQuery(db, { status: "open" });
      // Received two hours ago, answered one hour later.
      await db.query(
        "update public.queries set created_at = now() - interval '2 hours' where id = $1",
        [answered.id],
      );
      await db.query(
        `insert into public.query_messages (query_id, author_id, author_role, body, created_at)
         values ($1, $2, 'superadmin', 'Hello!', now() - interval '1 hour')`,
        [answered.id, admin.id],
      );

      const after = await as(
        db,
        admin.id,
        async () => (await db.query("select public.admin_query_stats() as s")).rows[0].s,
      );
      const count = (stats: Record<string, Record<string, number>>, group: string, key: string) =>
        stats[group]?.[key] ?? 0;
      expect(count(after, "by_status", "awaiting_customer")).toBe(
        count(before, "by_status", "awaiting_customer") + 1,
      );
      expect(count(after, "by_status", "open")).toBe(count(before, "by_status", "open") + 1);
      expect(count(after, "by_topic", "pricing")).toBe(count(before, "by_topic", "pricing") + 2);
      expect(after.new_this_week).toBe(before.new_this_week + 2);
      expect(after.responded_last_30_days).toBe(before.responded_last_30_days + 1);
      expect(after.avg_first_response_seconds).toBeGreaterThan(0);
    }));

  it("refuses everyone but Super Admins", () =>
    rollback(db, async () => {
      const customer = await createUser(db);
      await as(db, customer.id, async () => {
        expect(await expectDenied(db, () => db.query("select public.admin_query_stats()"))).toBe(
          "42501",
        );
      });
      await as(db, null, async () => {
        expect(await expectDenied(db, () => db.query("select public.admin_query_stats()"))).toBe(
          "42501",
        );
      });
    }));
});
