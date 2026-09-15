import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { checkoutRequestSchema } from "@/lib/validations";
import { generateOrderNumber } from "@/lib/order-number";
import { variantLabel } from "@/lib/format";

export const runtime = "nodejs";

type CheckoutVariant = {
  id: string;
  sku: string;
  size: string | null;
  color: string | null;
  inventory_quantity: number;
  inventory_mode: "owned" | "supplier";
  supplier_status: "not_applicable" | "unverified" | "available" | "low_stock" | "sold_out";
  supplier_verified_until: string | null;
  max_order_quantity: number;
  is_active: boolean;
  product: { id: string; name: string; slug: string; price_cents: number; status: string };
};

function supplierVerificationCurrent(v: CheckoutVariant) {
  if (!v.supplier_verified_until) return false;
  const expires = new Date(v.supplier_verified_until).getTime();
  return Number.isFinite(expires) && expires > Date.now();
}

/**
 * Creates a Stripe Checkout Session.
 * The browser sends only variant IDs and quantities. Pricing and availability
 * are re-read server-side immediately before Stripe Checkout is created.
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
  const db = supabase as any;
  const variantIds = parsed.data.items.map((i) => i.variantId);

  const { data, error } = await db
    .from("product_variants")
    .select(
      `id, sku, size, color, inventory_quantity, inventory_mode, supplier_status,
       supplier_verified_until, max_order_quantity, is_active,
       product:products!inner ( id, name, slug, price_cents, status )`
    )
    .in("id", variantIds)
    .eq("is_active", true)
    .eq("product.status", "active");

  if (error) {
    console.error("checkout: failed to load variants", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  const variants = (data ?? []) as CheckoutVariant[];
  const foundIds = new Set(variants.map((v) => v.id));
  const missing = variantIds.filter((id) => !foundIds.has(id));
  if (missing.length > 0) {
    return NextResponse.json(
      { error: "One or more items in your cart are no longer available. Please refresh your cart." },
      { status: 409 }
    );
  }

  const requestedQtyByVariant = new Map(parsed.data.items.map((i) => [i.variantId, i.quantity]));

  const supplierUnavailable = variants.filter(
    (v) =>
      v.inventory_mode === "supplier" &&
      (!supplierVerificationCurrent(v) || (v.supplier_status !== "available" && v.supplier_status !== "low_stock"))
  );
  if (supplierUnavailable.length > 0) {
    const names = [...new Set(supplierUnavailable.map((v) => v.product.name))].join(", ");
    return NextResponse.json(
      {
        error: `Supplier availability needs to be reconfirmed for: ${names}. Please refresh or try again after availability is verified.`,
      },
      { status: 409 }
    );
  }

  const insufficientOwnedStock = variants.filter(
    (v) =>
      v.inventory_mode === "owned" &&
      (requestedQtyByVariant.get(v.id) ?? 0) > v.inventory_quantity
  );
  if (insufficientOwnedStock.length > 0) {
    const names = [...new Set(insufficientOwnedStock.map((v) => v.product.name))].join(", ");
    return NextResponse.json(
      { error: `Not enough stock available for: ${names}. Please adjust your cart.` },
      { status: 409 }
    );
  }

  const supplierOverLimit = variants.filter(
    (v) =>
      v.inventory_mode === "supplier" &&
      (requestedQtyByVariant.get(v.id) ?? 0) > v.max_order_quantity
  );
  if (supplierOverLimit.length > 0) {
    const names = [...new Set(supplierOverLimit.map((v) => v.product.name))].join(", ");
    return NextResponse.json(
      { error: `Please reduce the quantity for: ${names}. Larger quantities require a fresh supplier check.` },
      { status: 409 }
    );
  }

  const { data: settings } = await supabase.from("store_settings").select("*").eq("id", true).maybeSingle();

  const orderNumber = generateOrderNumber();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aircarecrew.shop";

  const lineItems = variants.map((v) => {
    const label = variantLabel(v.size, v.color);
    const quantity = requestedQtyByVariant.get(v.id)!;

    return {
      quantity,
      price_data: {
        currency: "usd",
        unit_amount: v.product.price_cents,
        product_data: {
          name: label ? `${v.product.name} — ${label}` : v.product.name,
          metadata: {
            variantId: v.id,
            productId: v.product.id,
            sku: v.sku,
            variantLabel: label ?? "",
          },
        },
      },
    };
  });

  const subtotalCents = variants.reduce(
    (sum, v) => sum + v.product.price_cents * (requestedQtyByVariant.get(v.id) ?? 0),
    0
  );

  const freeThreshold = settings?.free_shipping_threshold_cents ?? null;
  const flatShipping = settings?.default_shipping_cents ?? 795;
  const shippingCents = freeThreshold !== null && subtotalCents >= freeThreshold ? 0 : flatShipping;
  const hasSupplierItems = variants.some((v) => v.inventory_mode === "supplier");

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
            display_name:
              shippingCents === 0
                ? "Free shipping"
                : hasSupplierItems
                  ? "Standard shipping • made to order"
                  : "Standard shipping",
            delivery_estimate: hasSupplierItems
              ? {
                  minimum: { unit: "business_day", value: 8 },
                  maximum: { unit: "business_day", value: 15 },
                }
              : {
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
