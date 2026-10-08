-- Row Level Security, grants and the narrow RPCs customers and admins use.
--
-- Model:
--   * anon (visitors) gets nothing. Visitor queries are inserted by a server
--     action with the service role (which bypasses RLS) after validation.
--   * authenticated users get explicit table/column grants below; RLS decides
--     which rows. Super Admins are authenticated users with role = 'superadmin'.
--   * Customer-only state changes (mark read, mark resolved) go through
--     SECURITY DEFINER functions that check ownership, so customers never
--     get a general UPDATE on queries.

-- ---------------------------------------------------------------------------
-- Grants: start from nothing, then allow only what is needed.
-- ---------------------------------------------------------------------------

revoke all on public.profiles, public.queries, public.query_messages, public.query_attachments,
  public.query_events, public.saved_replies, public.admin_settings, public.rate_limits
  from anon, authenticated;

revoke all on sequence public.query_reference_seq from anon, authenticated;

grant select on public.profiles to authenticated;
grant update (full_name, phone, locale) on public.profiles to authenticated;

grant select, insert on public.queries to authenticated;
grant update (status, assignee_id) on public.queries to authenticated;

grant select, insert on public.query_messages to authenticated;
grant select, insert on public.query_attachments to authenticated;
grant select on public.query_events to authenticated;
grant select, insert, update, delete on public.saved_replies to authenticated;
grant select, update (notification_recipients, auto_ack_en, auto_ack_ur, updated_by)
  on public.admin_settings to authenticated;

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere. Every table below has explicit policies.
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.queries enable row level security;
alter table public.query_messages enable row level security;
alter table public.query_attachments enable row level security;
alter table public.query_events enable row level security;
alter table public.saved_replies enable row level security;
alter table public.admin_settings enable row level security;
alter table public.rate_limits enable row level security;

-- profiles ------------------------------------------------------------------

create policy "profiles: users read their own"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

create policy "profiles: super admins read all"
  on public.profiles for select to authenticated
  using ((select public.is_superadmin()));

-- Only full_name, phone and locale are updatable (column grants + guard trigger).
create policy "profiles: users update their own"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- queries -------------------------------------------------------------------

create policy "queries: customers read their own"
  on public.queries for select to authenticated
  using (customer_id = (select auth.uid()));

create policy "queries: super admins read all"
  on public.queries for select to authenticated
  using ((select public.is_superadmin()));

-- A signed-in customer may create a query for themselves only, in its initial
-- state. (The site normally inserts through a validated server action.)
create policy "queries: customers create their own"
  on public.queries for insert to authenticated
  with check (
    customer_id = (select auth.uid())
    and status = 'new'
    and assignee_id is null
    and first_response_at is null
    and last_admin_reply_at is null
    and not exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.is_suspended
    )
  );

-- Status and assignee (the only updatable columns) are changed by Super Admins.
create policy "queries: super admins update"
  on public.queries for update to authenticated
  using ((select public.is_superadmin()))
  with check (
    (select public.is_superadmin())
    and (
      assignee_id is null
      or exists (select 1 from public.profiles p where p.id = assignee_id and p.role = 'superadmin')
    )
  );

-- query_messages ----------------------------------------------------------------

create policy "messages: customers read non-internal messages on their queries"
  on public.query_messages for select to authenticated
  using (
    not is_internal
    and exists (
      select 1 from public.queries q
      where q.id = query_id and q.customer_id = (select auth.uid())
    )
  );

create policy "messages: super admins read all"
  on public.query_messages for select to authenticated
  using ((select public.is_superadmin()));

create policy "messages: customers reply on their open queries"
  on public.query_messages for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and author_role = 'customer'
    and not is_internal
    and exists (
      select 1 from public.queries q
      join public.profiles p on p.id = q.customer_id
      where q.id = query_id
        and q.customer_id = (select auth.uid())
        and q.status <> 'closed'
        and not p.is_suspended
    )
  );

create policy "messages: super admins reply and add notes"
  on public.query_messages for insert to authenticated
  with check (
    (select public.is_superadmin())
    and author_id = (select auth.uid())
    and author_role = 'superadmin'
  );

-- query_attachments -------------------------------------------------------------

create policy "attachments: customers read on their queries, never on internal notes"
  on public.query_attachments for select to authenticated
  using (
    exists (
      select 1 from public.queries q
      where q.id = query_id and q.customer_id = (select auth.uid())
    )
    and (
      message_id is null
      or exists (
        select 1 from public.query_messages m
        where m.id = message_id and not m.is_internal
      )
    )
  );

create policy "attachments: super admins read all"
  on public.query_attachments for select to authenticated
  using ((select public.is_superadmin()));

create policy "attachments: customers add to their own messages"
  on public.query_attachments for insert to authenticated
  with check (
    exists (
      select 1 from public.queries q
      where q.id = query_id and q.customer_id = (select auth.uid()) and q.status <> 'closed'
    )
    and (
      message_id is null
      or exists (
        select 1 from public.query_messages m
        where m.id = message_id and m.query_id = query_id and m.author_id = (select auth.uid())
      )
    )
    and storage_path like (query_id::text || '/%')
  );

create policy "attachments: super admins add"
  on public.query_attachments for insert to authenticated
  with check ((select public.is_superadmin()) and storage_path like (query_id::text || '/%'));

-- query_events (written by triggers only) ---------------------------------------

create policy "events: super admins read"
  on public.query_events for select to authenticated
  using ((select public.is_superadmin()));

create policy "events: no direct writes"
  on public.query_events for insert to authenticated
  with check (false);

-- saved_replies -------------------------------------------------------------------

create policy "saved replies: super admins read"
  on public.saved_replies for select to authenticated
  using ((select public.is_superadmin()));

create policy "saved replies: super admins create"
  on public.saved_replies for insert to authenticated
  with check ((select public.is_superadmin()));

create policy "saved replies: super admins update"
  on public.saved_replies for update to authenticated
  using ((select public.is_superadmin()))
  with check ((select public.is_superadmin()));

create policy "saved replies: super admins delete"
  on public.saved_replies for delete to authenticated
  using ((select public.is_superadmin()));

-- admin_settings ------------------------------------------------------------------

create policy "settings: super admins read"
  on public.admin_settings for select to authenticated
  using ((select public.is_superadmin()));

create policy "settings: super admins update"
  on public.admin_settings for update to authenticated
  using ((select public.is_superadmin()))
  with check ((select public.is_superadmin()));

-- rate_limits (service role only) -------------------------------------------------

create policy "rate limits: no client access"
  on public.rate_limits for all to anon, authenticated
  using (false)
  with check (false);

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------

-- Customer opened their query: clears the unread dot.
create function public.mark_query_read(p_query_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.queries
  set customer_last_read_at = now()
  where id = p_query_id and customer_id = (select auth.uid());
end;
$$;

-- Customer marks their own query as resolved.
create function public.resolve_my_query(p_query_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed integer;
begin
  update public.queries
  set status = 'resolved'
  where id = p_query_id
    and customer_id = (select auth.uid())
    and status not in ('resolved', 'closed')
    and not exists (
      select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_suspended
    );
  get diagnostics changed = row_count;
  return changed > 0;
end;
$$;

-- Super Admin suspends or restores a customer account (never another admin).
create function public.set_customer_suspended(p_user_id uuid, p_suspended boolean)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed integer;
begin
  if not public.is_superadmin() then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  update public.profiles
  set is_suspended = p_suspended
  where id = p_user_id and role = 'customer';
  get diagnostics changed = row_count;
  return changed > 0;
end;
$$;

-- Promotes an existing user to Super Admin. Only callable by the service role
-- or SQL run as postgres (scripts/make-superadmin.ts, SQL editor).
create function public.promote_to_superadmin(p_email text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target uuid;
begin
  update public.profiles
  set role = 'superadmin', is_suspended = false
  where email = lower(btrim(p_email))
  returning id into target;

  if target is null then
    raise exception 'No account with email %. Sign up on the site first.', p_email
      using errcode = 'P0002';
  end if;
  return target;
end;
$$;

-- Function execute rights: deny by default, then allow.
revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function public.is_superadmin() to authenticated;
grant execute on function public.mark_query_read(uuid) to authenticated;
grant execute on function public.resolve_my_query(uuid) to authenticated;
grant execute on function public.set_customer_suspended(uuid, boolean) to authenticated;
-- Needed when an authenticated customer inserts a query (column default).
grant execute on function public.next_query_reference() to authenticated;

grant execute on function public.promote_to_superadmin(text) to service_role;
grant execute on function public.hit_rate_limit(text, integer, integer) to service_role;

-- New functions in this schema are not executable by clients unless granted.
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
