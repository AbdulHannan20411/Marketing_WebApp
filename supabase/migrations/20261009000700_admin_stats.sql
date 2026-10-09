-- Dashboard numbers for the Super Admin area, computed in one round trip.
-- SECURITY INVOKER: it reads through RLS as the caller, and refuses anyone who
-- is not a Super Admin (who would otherwise just see their own queries).

create function public.admin_query_stats()
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  if not public.is_superadmin() then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'by_status', (
      select coalesce(jsonb_object_agg(status, n), '{}'::jsonb)
      from (select status, count(*) as n from public.queries group by status) s
    ),
    'by_topic', (
      select coalesce(jsonb_object_agg(topic, n), '{}'::jsonb)
      from (select topic, count(*) as n from public.queries group by topic) t
    ),
    'new_this_week', (
      select count(*) from public.queries where created_at >= now() - interval '7 days'
    ),
    -- Average time from a query arriving to our first public reply, last 30 days.
    'avg_first_response_seconds', (
      select round(extract(epoch from avg(first_response_at - created_at)))
      from public.queries
      where first_response_at is not null
        and created_at >= now() - interval '30 days'
    ),
    'responded_last_30_days', (
      select count(*)
      from public.queries
      where first_response_at is not null
        and created_at >= now() - interval '30 days'
    )
  );
end;
$$;

grant execute on function public.admin_query_stats() to authenticated;
