-- Product image storage. Public read (storefront images), writes only via
-- the service-role client (admin server actions), matching the RLS model
-- used for the rest of the schema.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  8388608, -- 8 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do nothing;

create policy "Public read product images"
on storage.objects for select
using (bucket_id = 'product-images');

create policy "Service role manages product images"
on storage.objects for all
using (bucket_id = 'product-images' and auth.role() = 'service_role')
with check (bucket_id = 'product-images' and auth.role() = 'service_role');
