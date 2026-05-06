-- Storage bucket setup - run after schema.sql
-- Creates two buckets: property-photos (public read) and receipts (private)

insert into storage.buckets (id, name, public)
values ('property-photos', 'property-photos', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

-- Photos: authenticated users can upload to their own folder, anyone can read
drop policy if exists "photos_read" on storage.objects;
create policy "photos_read" on storage.objects for select
  using (bucket_id = 'property-photos');

drop policy if exists "photos_insert" on storage.objects;
create policy "photos_insert" on storage.objects for insert
  with check (bucket_id = 'property-photos' and auth.role() = 'authenticated');

drop policy if exists "photos_delete" on storage.objects;
create policy "photos_delete" on storage.objects for delete
  using (bucket_id = 'property-photos' and auth.role() = 'authenticated');

-- Receipts: only owner can access
drop policy if exists "receipts_owner_all" on storage.objects;
create policy "receipts_owner_all" on storage.objects for all
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);
