create table if not exists public.product_vendor_links (
  product_id uuid primary key references public.products (id) on delete cascade,
  vendor_name text,
  vendor_product_url text,
  vendor_sku text,
  notes text,
  updated_at timestamptz not null default now()
);

alter table public.product_vendor_links enable row level security;

comment on table public.product_vendor_links is
  'Internal supplier/source metadata for products. Accessed only through server-side admin service-role code; no public RLS policy.';
