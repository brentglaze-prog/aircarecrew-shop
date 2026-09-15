-- Optional private sourcing reference for store administrators.
-- This field is intentionally not rendered on the public storefront.
alter table public.products
  add column if not exists vendor_url text;

comment on column public.products.vendor_url is
  'Admin-only source/vendor product URL. Never rendered to customers by default.';
