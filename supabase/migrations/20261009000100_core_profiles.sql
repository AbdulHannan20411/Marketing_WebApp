-- Core types, helpers and user profiles.
--
-- A profile row is created for every auth user by a trigger, always with
-- role = 'customer'. The role can only be changed by SQL run as a privileged
-- database role (see promote_to_superadmin in the security migration).

create type public.user_role as enum ('customer', 'superadmin');
create type public.locale_code as enum ('en', 'ur');

-- Keeps updated_at current on every update.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '' check (char_length(full_name) <= 120),
  phone text check (phone is null or char_length(phone) <= 32),
  locale public.locale_code not null default 'en',
  role public.user_role not null default 'customer',
  is_suspended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.profiles.role is
  'customer or superadmin. Never settable from the client; see promote_to_superadmin().';

create index profiles_role_idx on public.profiles (role);
create index profiles_email_idx on public.profiles (lower(email));

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- New auth user → profile. Only safe fields are read from user metadata; any
-- "role" in the metadata is ignored.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.profiles (id, email, full_name, phone, locale)
  values (
    new.id,
    lower(coalesce(new.email, '')),
    left(btrim(coalesce(meta ->> 'full_name', '')), 120),
    nullif(left(btrim(coalesce(meta ->> 'phone', '')), 32), ''),
    case when meta ->> 'locale' = 'ur' then 'ur'::public.locale_code else 'en'::public.locale_code end
  );
  return new;
end;
$$;

-- Trigger names fire in alphabetical order: "created" runs before "email_*".
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep the profile email in step with auth.users.
create function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = lower(coalesce(new.email, '')) where id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row execute function public.sync_profile_email();

-- True when the signed-in user is an active Super Admin. SECURITY DEFINER so
-- policies on profiles can call it without recursing into their own RLS.
create function public.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'superadmin'
      and not is_suspended
  );
$$;

-- Defence in depth on top of column grants: client roles can never change
-- role, suspension or email, even if a grant is added by mistake later.
create function public.guard_profile_privileged_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated')
     and (
       new.role is distinct from old.role
       or new.is_suspended is distinct from old.is_suspended
       or new.email is distinct from old.email
       or new.id is distinct from old.id
     )
  then
    raise exception 'Not allowed to change protected profile fields'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger profiles_guard_privileged_columns
  before update on public.profiles
  for each row execute function public.guard_profile_privileged_columns();
