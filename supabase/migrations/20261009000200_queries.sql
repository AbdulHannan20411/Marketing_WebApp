-- Queries (support / sales enquiries), their message thread, attachments and
-- activity log. Status and timestamps are maintained by triggers so every
-- write path (server actions, RPCs, SQL) stays consistent.

create type public.query_topic as enum ('pricing', 'demo', 'technical', 'billing', 'partnership', 'other');
create type public.query_status as enum ('new', 'open', 'awaiting_customer', 'resolved', 'closed');
create type public.query_source as enum ('contact_page', 'dialog', 'pricing');
create type public.message_author_role as enum ('customer', 'superadmin', 'visitor');
create type public.query_event_type as enum (
  'created',
  'status_changed',
  'assigned',
  'replied',
  'customer_replied',
  'note_added',
  'attachment_added',
  'linked_to_account'
);

-- References look like NR-2026-00042 (year in Pakistan time).
create sequence public.query_reference_seq;

create function public.next_query_reference()
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  n bigint := nextval('public.query_reference_seq');
begin
  -- lpad would truncate numbers above 99999, so only pad shorter ones.
  return 'NR-' || to_char(now() at time zone 'Asia/Karachi', 'YYYY') || '-'
    || case when n < 100000 then lpad(n::text, 5, '0') else n::text end;
end;
$$;

create table public.queries (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default public.next_query_reference(),
  customer_id uuid references public.profiles (id) on delete set null,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  email text not null check (char_length(email) between 3 and 254 and email = lower(email)),
  phone text check (phone is null or char_length(phone) <= 32),
  topic public.query_topic not null,
  answers jsonb not null default '{}'::jsonb check (jsonb_typeof(answers) = 'object'),
  subject text not null check (char_length(btrim(subject)) between 1 and 200),
  message text not null check (char_length(btrim(message)) between 20 and 2000),
  status public.query_status not null default 'new',
  assignee_id uuid references public.profiles (id) on delete set null,
  locale public.locale_code not null default 'en',
  source public.query_source not null default 'contact_page',
  utm jsonb not null default '{}'::jsonb check (jsonb_typeof(utm) = 'object'),
  ip_hash text check (ip_hash is null or char_length(ip_hash) <= 128),
  last_activity_at timestamptz not null default now(),
  first_response_at timestamptz,
  last_admin_reply_at timestamptz,
  customer_last_read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search tsvector generated always as (
    to_tsvector(
      'simple',
      reference || ' ' || email || ' ' || coalesce(subject, '') || ' ' || coalesce(message, '')
    )
  ) stored
);

comment on column public.queries.answers is 'Structured topic answers (option keys), shown as chips in the admin.';
comment on column public.queries.customer_last_read_at is 'Drives the unread dot in the customer portal.';

create index queries_customer_idx on public.queries (customer_id, last_activity_at desc);
create index queries_email_idx on public.queries (email);
create index queries_status_activity_idx on public.queries (status, last_activity_at desc);
create index queries_assignee_idx on public.queries (assignee_id);
create index queries_topic_idx on public.queries (topic);
create index queries_created_idx on public.queries (created_at desc);
create index queries_search_idx on public.queries using gin (search);

create trigger queries_set_updated_at
  before update on public.queries
  for each row execute function public.set_updated_at();

create table public.query_messages (
  id uuid primary key default gen_random_uuid(),
  query_id uuid not null references public.queries (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  author_role public.message_author_role not null,
  body text not null check (char_length(btrim(body)) between 1 and 5000),
  is_internal boolean not null default false,
  created_at timestamptz not null default now(),
  -- Internal notes are only ever written by Super Admins.
  constraint internal_notes_are_admin_only check (not is_internal or author_role = 'superadmin')
);

create index query_messages_query_idx on public.query_messages (query_id, created_at);

create table public.query_attachments (
  id uuid primary key default gen_random_uuid(),
  query_id uuid not null references public.queries (id) on delete cascade,
  message_id uuid references public.query_messages (id) on delete cascade,
  storage_path text not null unique check (char_length(storage_path) <= 512),
  file_name text not null check (char_length(file_name) between 1 and 255),
  content_type text not null check (content_type in ('image/png', 'image/jpeg', 'application/pdf')),
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 5242880),
  created_at timestamptz not null default now()
);

create index query_attachments_query_idx on public.query_attachments (query_id);
create index query_attachments_message_idx on public.query_attachments (message_id);

create table public.query_events (
  id uuid primary key default gen_random_uuid(),
  query_id uuid not null references public.queries (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  type public.query_event_type not null,
  data jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object'),
  created_at timestamptz not null default now()
);

create index query_events_query_idx on public.query_events (query_id, created_at);

-- ---------------------------------------------------------------------------
-- Activity log and status automation
-- ---------------------------------------------------------------------------

create function public.on_query_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.query_events (query_id, actor_id, type, data)
  values (new.id, new.customer_id, 'created', jsonb_build_object('source', new.source, 'topic', new.topic));
  return new;
end;
$$;

create trigger queries_log_created
  after insert on public.queries
  for each row execute function public.on_query_created();

create function public.on_query_updated()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    insert into public.query_events (query_id, actor_id, type, data)
    values (new.id, (select auth.uid()), 'status_changed',
            jsonb_build_object('from', old.status, 'to', new.status));
  end if;
  if new.assignee_id is distinct from old.assignee_id then
    insert into public.query_events (query_id, actor_id, type, data)
    values (new.id, (select auth.uid()), 'assigned',
            jsonb_build_object('from', old.assignee_id, 'to', new.assignee_id));
  end if;
  return new;
end;
$$;

create trigger queries_log_updates
  after update of status, assignee_id on public.queries
  for each row execute function public.on_query_updated();

-- A public Super Admin reply moves the query to "awaiting customer" and sets
-- first_response_at; a customer reply reopens it. Internal notes only log.
create function public.on_query_message_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.is_internal then
    insert into public.query_events (query_id, actor_id, type)
    values (new.query_id, new.author_id, 'note_added');
    return new;
  end if;

  if new.author_role = 'superadmin' then
    update public.queries
    set last_activity_at = new.created_at,
        last_admin_reply_at = new.created_at,
        first_response_at = coalesce(first_response_at, new.created_at),
        status = case when status in ('new', 'open') then 'awaiting_customer'::public.query_status else status end
    where id = new.query_id;

    insert into public.query_events (query_id, actor_id, type, data)
    values (new.query_id, new.author_id, 'replied', jsonb_build_object('message_id', new.id));
  else
    update public.queries
    set last_activity_at = new.created_at,
        status = case when status in ('awaiting_customer', 'resolved') then 'open'::public.query_status else status end
    where id = new.query_id;

    insert into public.query_events (query_id, actor_id, type, data)
    values (new.query_id, new.author_id, 'customer_replied', jsonb_build_object('message_id', new.id));
  end if;
  return new;
end;
$$;

create trigger query_messages_after_insert
  after insert on public.query_messages
  for each row execute function public.on_query_message_created();

create function public.on_query_attachment_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.query_events (query_id, actor_id, type, data)
  values (new.query_id, (select auth.uid()), 'attachment_added',
          jsonb_build_object('file_name', new.file_name, 'attachment_id', new.id));
  return new;
end;
$$;

create trigger query_attachments_after_insert
  after insert on public.query_attachments
  for each row execute function public.on_query_attachment_created();

-- ---------------------------------------------------------------------------
-- Link queries sent while signed out once the account email is confirmed.
-- ---------------------------------------------------------------------------

create function public.link_queries_to_confirmed_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email_confirmed_at is not null
     and new.email is not null
     and (tg_op = 'INSERT'
          or old.email_confirmed_at is null
          or old.email is distinct from new.email)
  then
    with linked as (
      update public.queries
      set customer_id = new.id
      where customer_id is null
        and email = lower(new.email)
      returning id
    )
    insert into public.query_events (query_id, actor_id, type)
    select id, new.id, 'linked_to_account' from linked;
  end if;
  return new;
end;
$$;

-- Fires after on_auth_user_created (alphabetical), so the profile exists.
create trigger on_auth_user_email_confirmed
  after insert or update of email_confirmed_at, email on auth.users
  for each row execute function public.link_queries_to_confirmed_user();
