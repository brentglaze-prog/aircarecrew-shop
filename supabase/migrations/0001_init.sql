-- =============================================================================
-- AirCareCrew.shop — initial schema
--
-- Design notes (documented per project convention — ASSUMED/LIKELY decisions
-- made without stopping to ask, since none of this is a business decision):
--
--  * Inventory lives on product_variants directly rather than a separate
--    `inventory` table — every product always has at least one variant row
--    (size/color both NULL for "no variants" products), so variant IS the
--    inventory unit. This avoids a redundant 1:1 table.
--  * Categories use ON DELETE SET NULL for products.category_id: deleting a
--    category never deletes or hides a product, it just becomes
--    uncategorized (still visible under "All Products"). The admin UI must
--    warn how many products will be affected before a delete.
--  * order_items denormalizes product name / variant label / SKU / price at
--    time of sale, and product_id / variant_id are ON DELETE SET NULL, so
--    historical orders never break or change if a product is later edited,
--    archived, or deleted.
--  * webhook_events gives idempotent Stripe webhook processing (a event id
--    can only be recorded once).
--  * fn_record_stripe_order() does order + order_items insert and inventory
--    decrement in one atomic, idempotent, SECURITY DEFINER transaction so
--    concurrent/duplicate webhook deliveries can't double-decrement stock.
-- =============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- admin_users — membership table for who may use /admin.
-- Rows are created manually by the store owner (see SETUP.md) after creating
-- a user in Supabase Auth. There is no public signup path.
-- ---------------------------------------------------------------------------
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  is_visible boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_categories_display_order on public.categories (display_order);

-- ---------------------------------------------------------------------------
-- products
-- status: 'draft' (hidden), 'active' (live), 'archived' (soft-deleted, kept
-- for order history integrity — never shown storefront or default admin list)
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories (id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  short_description text,
  price_cents integer not null check (price_cents >= 0),
  compare_at_price_cents integer check (compare_at_price_cents is null or compare_at_price_cents >= 0),
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  is_featured boolean not null default false,
  display_order integer not null default 0,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_products_category on public.products (category_id);
create index if not exists idx_products_status on public.products (status);
create index if not exists idx_products_slug on public.products (slug);

-- ---------------------------------------------------------------------------
-- product_images
-- ---------------------------------------------------------------------------
create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  url text not null,
  alt_text text,
  display_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_product_images_product on public.product_images (product_id);

-- Only one primary image per product.
create unique index if not exists uq_product_images_primary
  on public.product_images (product_id)
  where is_primary;

-- ---------------------------------------------------------------------------
-- product_variants
-- size / color are simple free-text option values (kept intentionally
-- unnormalized for a small store); a product with no real variants gets a
-- single row with size = NULL and color = NULL.
-- ---------------------------------------------------------------------------
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  sku text not null unique,
  size text,
  color text,
  inventory_quantity integer not null default 0 check (inventory_quantity >= 0),
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_product_variant_option unique (product_id, size, color)
);

create index if not exists idx_product_variants_product on public.product_variants (product_id);

-- ---------------------------------------------------------------------------
-- store_settings — single row of merchant-editable configuration.
-- ---------------------------------------------------------------------------
create table if not exists public.store_settings (
  id boolean primary key default true constraint singleton check (id),
  store_name text not null default 'AirCareCrew.shop',
  store_email text not null default 'hello@aircarecrew.shop',
  announcement_bar_enabled boolean not null default false,
  announcement_bar_text text,
  default_shipping_cents integer not null default 795,
  free_shipping_threshold_cents integer,
  maintenance_mode boolean not null default false,
  social_links jsonb not null default '{}'::jsonb,
  return_policy_summary text not null default
    'Returns accepted within 30 days of delivery on unworn, unwashed items with tags attached. Contact us to start a return.',
  footer_text text not null default
    'AirCareCrew.shop is an independently operated crew merchandise store and is not an official merchandise outlet of any employer or air-medical operator.',
  updated_at timestamptz not null default now()
);

insert into public.store_settings (id) values (true) on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  customer_email text not null,
  customer_name text,
  shipping_address jsonb,
  billing_address jsonb,
  subtotal_cents integer not null default 0,
  shipping_cents integer not null default 0,
  tax_cents integer not null default 0,
  total_cents integer not null default 0,
  currency text not null default 'usd',
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  fulfillment_status text not null default 'unfulfilled'
    check (fulfillment_status in ('unfulfilled', 'processing', 'shipped', 'completed', 'cancelled')),
  tracking_number text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_created_at on public.orders (created_at desc);
create index if not exists idx_orders_payment_status on public.orders (payment_status);
create index if not exists idx_orders_fulfillment_status on public.orders (fulfillment_status);

-- ---------------------------------------------------------------------------
-- order_items — denormalized snapshot so historical orders are immutable
-- with respect to later product edits/archival/deletion.
-- ---------------------------------------------------------------------------
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  variant_id uuid references public.product_variants (id) on delete set null,
  product_name text not null,
  variant_label text,
  sku text,
  unit_price_cents integer not null,
  quantity integer not null check (quantity > 0),
  line_total_cents integer not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_order_items_order on public.order_items (order_id);

-- ---------------------------------------------------------------------------
-- webhook_events — idempotency ledger for Stripe webhook deliveries.
-- ---------------------------------------------------------------------------
create table if not exists public.webhook_events (
  event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_categories_updated_at on public.categories;
create trigger trg_categories_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

drop trigger if exists trg_product_variants_updated_at on public.product_variants;
create trigger trg_product_variants_updated_at
  before update on public.product_variants
  for each row execute function public.set_updated_at();

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

drop trigger if exists trg_store_settings_updated_at on public.store_settings;
create trigger trg_store_settings_updated_at
  before update on public.store_settings
  for each row execute function public.set_updated_at();

-- =============================================================================
-- Row Level Security
--
-- Model: the browser only ever holds the anon key. Anon may READ public,
-- published storefront data and nothing else. All admin writes and the
-- Stripe webhook go through server-only route handlers using the service
-- role key (src/lib/supabase/admin.ts), which bypasses RLS entirely — so
-- these policies are a real enforcement layer, not the only protection.
-- =============================================================================

alter table public.admin_users enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.store_settings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.webhook_events enable row level security;

-- admin_users: a logged-in user may check only their own membership row
-- (used by middleware to gate /admin). No one may write via RLS.
create policy admin_users_self_select on public.admin_users
  for select using (auth.uid() = user_id);

-- categories: public can see visible categories; service role sees/writes all.
create policy categories_public_select on public.categories
  for select using (is_visible = true);

create policy categories_service_all on public.categories
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- products: public can see active products; service role sees/writes all.
create policy products_public_select on public.products
  for select using (status = 'active');

create policy products_service_all on public.products
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- product_images: public can see images belonging to an active product.
create policy product_images_public_select on public.product_images
  for select using (
    exists (
      select 1 from public.products p
      where p.id = product_images.product_id and p.status = 'active'
    )
  );

create policy product_images_service_all on public.product_images
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- product_variants: public can see active variants of an active product.
create policy product_variants_public_select on public.product_variants
  for select using (
    is_active = true
    and exists (
      select 1 from public.products p
      where p.id = product_variants.product_id and p.status = 'active'
    )
  );

create policy product_variants_service_all on public.product_variants
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- store_settings: publicly readable (no sensitive data), only service role writes.
create policy store_settings_public_select on public.store_settings
  for select using (true);

create policy store_settings_service_all on public.store_settings
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- orders / order_items / webhook_events: no public access at all.
create policy orders_service_all on public.orders
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy order_items_service_all on public.order_items
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy webhook_events_service_all on public.webhook_events
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- =============================================================================
-- fn_record_stripe_order — atomic, idempotent order recording + inventory
-- decrement, called once from the Stripe webhook handler after signature
-- verification. SECURITY DEFINER so it can run the whole transaction under
-- one privilege check regardless of caller role.
--
-- payload shape:
-- {
--   "event_id": "evt_...",
--   "event_type": "checkout.session.completed",
--   "order_number": "ACC-20260911-0001",
--   "stripe_checkout_session_id": "cs_...",
--   "stripe_payment_intent_id": "pi_...",
--   "customer_email": "...",
--   "customer_name": "...",
--   "shipping_address": {...} | null,
--   "billing_address": {...} | null,
--   "subtotal_cents": 0, "shipping_cents": 0, "tax_cents": 0, "total_cents": 0,
--   "currency": "usd",
--   "items": [
--     { "product_id": "uuid|null", "variant_id": "uuid|null",
--       "product_name": "...", "variant_label": "...", "sku": "...",
--       "unit_price_cents": 0, "quantity": 0 }
--   ]
-- }
--
-- Returns the order id (existing or newly created). If event_id was already
-- processed, returns the existing order without touching inventory again.
-- =============================================================================
create or replace function public.fn_record_stripe_order(payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id text := payload->>'event_id';
  v_existing_order_id uuid;
  v_order_id uuid;
  v_item jsonb;
  v_new_qty integer;
begin
  if v_event_id is null then
    raise exception 'event_id is required';
  end if;

  -- Idempotency: if we've already processed this Stripe event, return the
  -- order tied to this checkout session (if any) without decrementing stock
  -- again.
  if exists (select 1 from public.webhook_events we where we.event_id = v_event_id) then
    select o.id into v_existing_order_id
    from public.orders o
    where o.stripe_checkout_session_id = payload->>'stripe_checkout_session_id';
    return v_existing_order_id;
  end if;

  insert into public.webhook_events (event_id, event_type)
  values (v_event_id, coalesce(payload->>'event_type', 'unknown'));

  -- Also guard on the checkout session id directly, in case of a retried
  -- delivery with a regenerated event id for the same session.
  select o.id into v_existing_order_id
  from public.orders o
  where o.stripe_checkout_session_id = payload->>'stripe_checkout_session_id';

  if v_existing_order_id is not null then
    return v_existing_order_id;
  end if;

  insert into public.orders (
    order_number, stripe_checkout_session_id, stripe_payment_intent_id,
    customer_email, customer_name, shipping_address, billing_address,
    subtotal_cents, shipping_cents, tax_cents, total_cents, currency,
    payment_status
  ) values (
    payload->>'order_number',
    payload->>'stripe_checkout_session_id',
    payload->>'stripe_payment_intent_id',
    payload->>'customer_email',
    payload->>'customer_name',
    payload->'shipping_address',
    payload->'billing_address',
    coalesce((payload->>'subtotal_cents')::integer, 0),
    coalesce((payload->>'shipping_cents')::integer, 0),
    coalesce((payload->>'tax_cents')::integer, 0),
    coalesce((payload->>'total_cents')::integer, 0),
    coalesce(payload->>'currency', 'usd'),
    'paid'
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(payload->'items')
  loop
    insert into public.order_items (
      order_id, product_id, variant_id, product_name, variant_label, sku,
      unit_price_cents, quantity, line_total_cents
    ) values (
      v_order_id,
      nullif(v_item->>'product_id', '')::uuid,
      nullif(v_item->>'variant_id', '')::uuid,
      v_item->>'product_name',
      v_item->>'variant_label',
      v_item->>'sku',
      coalesce((v_item->>'unit_price_cents')::integer, 0),
      coalesce((v_item->>'quantity')::integer, 0),
      coalesce((v_item->>'unit_price_cents')::integer, 0) * coalesce((v_item->>'quantity')::integer, 0)
    );

    if (v_item->>'variant_id') is not null and (v_item->>'variant_id') <> '' then
      -- Payment already succeeded; never fail the order over stock. Floor
      -- at zero and note if this represents an oversell so the merchant can
      -- follow up (pre-checkout validation should make this rare).
      update public.product_variants
      set inventory_quantity = greatest(inventory_quantity - coalesce((v_item->>'quantity')::integer, 0), 0)
      where id = (v_item->>'variant_id')::uuid
      returning inventory_quantity into v_new_qty;

      if v_new_qty = 0 then
        update public.orders
        set notes = coalesce(notes || E'\n', '') ||
          format('Note: variant %s may have oversold (stock floored at 0).', v_item->>'sku')
        where id = v_order_id;
      end if;
    end if;
  end loop;

  return v_order_id;
end;
$$;

revoke all on function public.fn_record_stripe_order(jsonb) from public, anon, authenticated;
grant execute on function public.fn_record_stripe_order(jsonb) to service_role;
