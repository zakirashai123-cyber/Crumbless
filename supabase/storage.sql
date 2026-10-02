-- Crumbless — private licence bucket for driver's-licence images (minors' PII).
-- Run this once in Supabase → SQL Editor. Safe to re-run.
--
-- Both the web app and the mobile app upload licences to `app-licenses` under
-- '<user id>/…'. The bucket is PRIVATE; each user can read/write only their own
-- folder, and images are served via short-lived signed URLs — never public.
--
-- Do NOT use the public `app-photos` bucket for licences.

-- 1) Create the private bucket (idempotent). 6 MB cap, images + PDF only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('app-licenses', 'app-licenses', false, 6291456,
        array['image/png','image/jpeg','image/webp','application/pdf'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 2) A signed-in user may read/write ONLY their own folder: <their uid>/...
drop policy if exists "app-licenses owner insert" on storage.objects;
create policy "app-licenses owner insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'app-licenses' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "app-licenses owner select" on storage.objects;
create policy "app-licenses owner select" on storage.objects
  for select to authenticated
  using (bucket_id = 'app-licenses' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "app-licenses owner update" on storage.objects;
create policy "app-licenses owner update" on storage.objects
  for update to authenticated
  using (bucket_id = 'app-licenses' and (storage.foldername(name))[1] = auth.uid()::text);
