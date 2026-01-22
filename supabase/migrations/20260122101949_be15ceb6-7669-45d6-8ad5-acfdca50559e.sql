-- Create bucket for product images
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = excluded.public;

-- Public read access for product images
create policy "Public can read product images"
on storage.objects
for select
using (bucket_id = 'product-images');

-- Admin/Manager can upload product images
create policy "Admin/Manager can upload product images"
on storage.objects
for insert
with check (
  bucket_id = 'product-images'
  and public.is_admin_or_manager(auth.uid())
);

-- Admin/Manager can update product images
create policy "Admin/Manager can update product images"
on storage.objects
for update
using (
  bucket_id = 'product-images'
  and public.is_admin_or_manager(auth.uid())
);

-- Admin/Manager can delete product images
create policy "Admin/Manager can delete product images"
on storage.objects
for delete
using (
  bucket_id = 'product-images'
  and public.is_admin_or_manager(auth.uid())
);