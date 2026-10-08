-- Saved replies, admin settings (singleton) and the query rate limiter.

create table public.saved_replies (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 120),
  body text not null check (char_length(btrim(body)) between 1 and 5000),
  locale public.locale_code,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.saved_replies.locale is 'Language of the reply; null means usable for any language.';

create trigger saved_replies_set_updated_at
  before update on public.saved_replies
  for each row execute function public.set_updated_at();

-- Exactly one row (id is always true).
create table public.admin_settings (
  id boolean primary key default true check (id),
  notification_recipients text[] not null default '{}'
    check (cardinality(notification_recipients) <= 20),
  auto_ack_en text not null default '' check (char_length(auto_ack_en) <= 2000),
  auto_ack_ur text not null default '' check (char_length(auto_ack_ur) <= 2000),
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.admin_settings.notification_recipients is
  'Extra addresses for new-query emails, in addition to every Super Admin.';

create trigger admin_settings_set_updated_at
  before update on public.admin_settings
  for each row execute function public.set_updated_at();

insert into public.admin_settings (id, auto_ack_en, auto_ack_ur)
values (
  true,
  'Thanks for contacting NextReach. We have received your query and will reply as soon as we can, usually within one working day.',
  'NextReach سے رابطہ کرنے کا شکریہ۔ ہمیں آپ کا سوال مل گیا ہے اور ہم جلد از جلد، عموماً ایک کاروباری دن کے اندر، جواب دیں گے۔'
)
on conflict (id) do nothing;

-- Sliding-window rate limit log: one row per attempt.
create table public.rate_limits (
  id bigint generated always as identity primary key,
  key text not null check (char_length(key) <= 200),
  created_at timestamptz not null default now()
);

create index rate_limits_key_created_idx on public.rate_limits (key, created_at desc);
create index rate_limits_created_idx on public.rate_limits (created_at);

comment on table public.rate_limits is
  'Attempts per key (e.g. ip:<hash>, email:<address>). Only the service role uses it.';

-- Records an attempt and returns true while the key is within p_limit attempts
-- in the last p_window_seconds. Sliding window, so bursts across a boundary
-- are still counted. Old rows are pruned now and then.
create function public.hit_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  attempts integer;
begin
  if p_key is null or p_limit < 1 or p_window_seconds < 1 then
    raise exception 'Invalid rate limit arguments';
  end if;

  insert into public.rate_limits (key) values (p_key);

  select count(*) into attempts
  from public.rate_limits
  where key = p_key
    and created_at > now() - make_interval(secs => p_window_seconds);

  if random() < 0.02 then
    delete from public.rate_limits where created_at < now() - interval '2 days';
  end if;

  return attempts <= p_limit;
end;
$$;
