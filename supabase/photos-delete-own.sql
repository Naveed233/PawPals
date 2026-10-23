-- PawPair — let a user delete their own uploaded photos. Paste into Supabase → SQL Editor → Run.
-- Idempotent: safe to run more than once. Apply AFTER setup.sql (also appended there).
--
-- The photos bucket allowed reading (anyone) and uploading (own folder) but not deleting,
-- so deleting a dog left its photos in storage forever. Same folder rule as photos_upload:
-- the first path segment must be your user id.

drop policy if exists photos_delete on storage.objects;
create policy photos_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
