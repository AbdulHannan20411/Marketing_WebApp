-- Private storage bucket for query attachments, and realtime for the inbox.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'query-attachments',
  'query-attachments',
  false,
  5242880,
  array['image/png', 'image/jpeg', 'application/pdf']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Objects are stored as "<query_id>/<uuid>-<file name>". Uploads and signed
-- URLs are created by the server with the service role after its own checks;
-- these read policies are defence in depth for direct API access.

create policy "query attachments: super admins read"
  on storage.objects for select to authenticated
  using (bucket_id = 'query-attachments' and (select public.is_superadmin()));

create policy "query attachments: owners read their files"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'query-attachments'
    and exists (
      select 1
      from public.query_attachments a
      join public.queries q on q.id = a.query_id
      left join public.query_messages m on m.id = a.message_id
      where a.storage_path = storage.objects.name
        and q.customer_id = (select auth.uid())
        and (m.id is null or not m.is_internal)
    )
  );

-- Live inbox updates (Supabase Realtime respects RLS for these tables).
alter publication supabase_realtime add table public.queries, public.query_messages;
