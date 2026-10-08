-- Helper for the visitor query action: the id of an account whose email is
-- confirmed, so a query sent while signed out with that email is linked at once.
-- (Unconfirmed accounts are linked later by link_queries_to_confirmed_user.)

create function public.confirmed_user_id(p_email text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select u.id
  from auth.users u
  where lower(u.email) = lower(btrim(p_email))
    and u.email_confirmed_at is not null
  limit 1;
$$;

revoke execute on function public.confirmed_user_id(text) from public, anon, authenticated;
grant execute on function public.confirmed_user_id(text) to service_role;
