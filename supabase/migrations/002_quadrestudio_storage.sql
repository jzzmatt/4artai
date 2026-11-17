-- QuadreStudio storage buckets.
-- templates is public to read. Writes require profiles.role = 'admin'.
-- originals, styles, and outputs are private. Authenticated users may
-- read and write only objects under their own user id folder.
-- Replacing a file needs select, insert, and update together.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('templates', 'templates', true, 26214400, array['image/jpeg', 'image/png', 'image/webp']),
  ('originals', 'originals', false, 26214400, array['image/jpeg', 'image/png', 'image/webp']),
  ('styles', 'styles', false, 26214400, array['image/jpeg', 'image/png', 'image/webp']),
  ('outputs', 'outputs', false, 26214400, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists templates_public_read on storage.objects;
drop policy if exists templates_admin_insert on storage.objects;
drop policy if exists templates_admin_update on storage.objects;
drop policy if exists templates_admin_delete on storage.objects;
drop policy if exists originals_select_own on storage.objects;
drop policy if exists originals_insert_own on storage.objects;
drop policy if exists originals_update_own on storage.objects;
drop policy if exists originals_delete_own on storage.objects;
drop policy if exists styles_select_own on storage.objects;
drop policy if exists styles_insert_own on storage.objects;
drop policy if exists styles_update_own on storage.objects;
drop policy if exists styles_delete_own on storage.objects;
drop policy if exists outputs_select_own on storage.objects;
drop policy if exists outputs_insert_own on storage.objects;
drop policy if exists outputs_update_own on storage.objects;
drop policy if exists outputs_delete_own on storage.objects;

create policy templates_public_read
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'templates');

create policy templates_admin_insert
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'templates' and (select private.is_admin()));

create policy templates_admin_update
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'templates' and (select private.is_admin()))
  with check (bucket_id = 'templates' and (select private.is_admin()));

create policy templates_admin_delete
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'templates' and (select private.is_admin()));

create policy originals_select_own
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'originals'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy originals_insert_own
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'originals'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy originals_update_own
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'originals'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'originals'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy originals_delete_own
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'originals'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy styles_select_own
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'styles'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy styles_insert_own
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'styles'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy styles_update_own
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'styles'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'styles'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy styles_delete_own
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'styles'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy outputs_select_own
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'outputs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy outputs_insert_own
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'outputs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy outputs_update_own
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'outputs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'outputs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy outputs_delete_own
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'outputs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
