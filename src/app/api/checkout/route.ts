import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { checkoutRequestSchema } from "@/lib/validations";
import { generateOrderNumber } from "@/lib/order-number";
import { variantLabel } from "@/lib/format";

export const runtime = "nodejs";

/**
 * Creates a Stripe Checkout Session.
 *
 * Security-critical: the browser sends ONLY { variantId, quantity } pairs.
 * Every price, product name, and inventory check below comes from the
 * database, never from the request body — this is what prevents
 * client-side price manipulation.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = checkoutRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Your cart looks invalid. Please refresh and try again." }, { status: 400 });
  }

  const supabase = await createClient();
  const variantIds = parsed.data.items.map((i) => i.variantId);

  // RLS already restricts this to active variants of active products (anon
  // key), but we filter explicitly too for a clear, self-documenting query.
  const { data: variants, error } = await supabase
    .from("product_variants")
    .select(
      `id, sku, size, color, inventory_quantity, is_active,
       product:products!inner ( id, name, slug, price_cents, status )`
    )
    .in("id", variantIds)
    .eq("is_active", true)
    .eq("product.status", "active");

  if (error) {
    console.error("checkout: failed to load variants", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  const foundIds = new Set((variants ?? []).map((v) => v.id));
  const missing = variantIds.filter((id) => !foundIds.has(id));
  if (missing.length > 0) {
    return NextResponse.json(
      { error: "One or more items in your cart are no longer available. Please refresh your cart." },
      { status: 409 }
    );
  }

  const requestedQtyByVariant = new Map(parsed.data.items.map((i) => [i.variantId, i.quantity]));
  const insufficientStock = (variants ?? []).filter(
    (v) => (requestedQtyByVariant.get(v.id) ?? 0) > v.inventory_quantity
  );
  if (insufficientStock.length > 0) {
    const names = insufficientStock.map((v) => (v.product as unknown as { name: string }).name).join(", ");
    return NextResponse.json(
      { error: `Not enough stock available for: ${names}. Please adjust your cart.` },
      { status: 409 }
    );
  }

  const { data: settings } = await supabase.from("store_settings").select("*").eq("id", true).maybeSingle();

  const orderNumber = generateOrderNumber();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aircarecrew.shop";

  const lineItems = (variants ?? []).map((v) => {
    const product = v.product as unknown as { id: string; name: string; price_cents: number };
    const label = variantLabel(v.size, v.color);
    const quantity = requestedQtyByVariant.get(v.id)!;

    return {
      quantity,
      price_data: {
        currency: "usd",
        unit_amount: product.price_cents,
        product_data: {
          name: label ? `${product.name} — ${label}` : product.name,
          metadata: {
            variantId: v.id,
            productId: product.id,
            sku: v.sku,
            variantLabel: label ?? "",
          },
        },
      },
    };
  });

  const subtotalCents = (variants ?? []).reduce((sum, v) => {
    const product = v.product as unknown as { price_cents: number };
    return sum + product.price_cents * (requestedQtyByVariant.get(v.id) ?? 0);
  }, 0);

  const freeThreshold = settings?.free_shipping_threshold_cents ?? null;
  const flatShipping = settings?.default_shipping_cents ?? 795;
  const shippingCents = freeThreshold !== null && subtotalCents >= freeThreshold ? 0 : flatShipping;

  try {
    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      shipping_address_collection: { allowed_countries: ["US"] },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: shippingCents, currency: "usd" },
            display_name: shippingCents === 0 ? "Free shipping" : "Standard shipping",
            delivery_estimate: {
              minimum: { unit: "business_day", value: 3 },
              maximum: { unit: "business_day", value: 7 },
            },
          },
        },
      ],
      ...(process.env.STRIPE_AUTOMATIC_TAX_ENABLED === "true"
        ? { automatic_tax: { enabled: true } }
        : {}),
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/?checkout=cancelled`,
      metadata: { order_number: orderNumber },
    });

    if (!session.url) {
      return NextResponse.json({ error: "Could not start checkout. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("checkout: stripe session creation failed", err);
    return NextResponse.json({ error: "Could not start checkout. Please try again." }, { status: 500 });
  }
}
