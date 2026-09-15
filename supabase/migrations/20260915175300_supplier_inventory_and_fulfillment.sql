-- Supplier-aware inventory and fulfillment for curated Queensboro products.
-- Supplier variants are gated by a recent manual verification rather than a
-- fabricated on-hand quantity. Paid supplier items create fulfillment tasks
-- instead of decrementing local inventory.

alter table public.product_variants
  add column if not exists inventory_mode text not null default 'owned'
    check (inventory_mode in ('owned', 'supplier')),
  add column if not exists supplier_status text not null default 'not_applicable'
    check (supplier_status in ('not_applicable', 'unverified', 'available', 'low_stock', 'sold_out')),
  add column if not exists supplier_checked_at timestamptz,
  add column if not exists supplier_verified_until timestamptz,
  add column if not exists max_order_quantity integer not null default 10
    check (max_order_quantity between 1 and 25);

alter table public.order_items
  add column if not exists supplier_fulfillment_status text not null default 'not_required'
    check (supplier_fulfillment_status in ('not_required', 'ready_to_order', 'ordered', 'in_production', 'shipped', 'cancelled')),
  add column if not exists supplier_order_number text,
  add column if not exists supplier_ordered_at timestamptz,
  add column if not exists supplier_tracking_number text;

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
  v_is_supplier boolean;
begin
  if v_event_id is null then
    raise exception 'event_id is required';
  end if;

  if exists (select 1 from public.webhook_events we where we.event_id = v_event_id) then
    select o.id into v_existing_order_id
    from public.orders o
    where o.stripe_checkout_session_id = payload->>'stripe_checkout_session_id';
    return v_existing_order_id;
  end if;

  insert into public.webhook_events (event_id, event_type)
  values (v_event_id, coalesce(payload->>'event_type', 'unknown'));

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
  ) returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(payload->'items')
  loop
    v_is_supplier := false;
    if (v_item->>'variant_id') is not null and (v_item->>'variant_id') <> '' then
      select (pv.inventory_mode = 'supplier')
      into v_is_supplier
      from public.product_variants pv
      where pv.id = (v_item->>'variant_id')::uuid;
    end if;

    insert into public.order_items (
      order_id, product_id, variant_id, product_name, variant_label, sku,
      unit_price_cents, quantity, line_total_cents, supplier_fulfillment_status
    ) values (
      v_order_id,
      nullif(v_item->>'product_id', '')::uuid,
      nullif(v_item->>'variant_id', '')::uuid,
      v_item->>'product_name',
      v_item->>'variant_label',
      v_item->>'sku',
      coalesce((v_item->>'unit_price_cents')::integer, 0),
      coalesce((v_item->>'quantity')::integer, 0),
      coalesce((v_item->>'unit_price_cents')::integer, 0) * coalesce((v_item->>'quantity')::integer, 0),
      case when coalesce(v_is_supplier, false) then 'ready_to_order' else 'not_required' end
    );

    if (v_item->>'variant_id') is not null and (v_item->>'variant_id') <> '' and not coalesce(v_is_supplier, false) then
      update public.product_variants
      set inventory_quantity = greatest(inventory_quantity - coalesce((v_item->>'quantity')::integer, 0), 0)
      where id = (v_item->>'variant_id')::uuid
        and inventory_mode = 'owned'
      returning inventory_quantity into v_new_qty;

      if found and v_new_qty = 0 then
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

-- Curated Queensboro catalog. Numeric stock is deliberately zeroed as a
-- failsafe for older application code; supplier-aware checkout ignores this
-- field and uses verification status instead.
update public.product_variants pv
set inventory_mode = 'supplier',
    supplier_status = 'unverified',
    supplier_checked_at = null,
    supplier_verified_until = null,
    max_order_quantity = 5,
    inventory_quantity = 0
from public.products p
where p.id = pv.product_id
  and p.slug in (
    'aircare-performance-tee-purple',
    'atl-performance-tee-purple',
    'aircare-raglan-34',
    'atl-raglan-34',
    'aircare-core-fleece-hoodie-black',
    'atl-core-fleece-hoodie-black',
    'atl-seven-panel-trucker-cap',
    'atl-low-pro-trucker-cap',
    'atl-pom-pom-cuffed-beanie',
    'atl-carhartt-watch-cap',
    'atl-nike-terra-beanie',
    'aircare-classic-knit-beanie'
  );
