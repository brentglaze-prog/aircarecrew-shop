import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/database.types";

export const runtime = "nodejs";

/**
 * Stripe webhook endpoint. Signature verification is mandatory — this is
 * the only thing standing between "a real Stripe payment" and "anyone on
 * the internet POSTing a fake paid order." Order recording + inventory
 * decrement happen atomically and idempotently in fn_record_stripe_order()
 * (supabase/migrations/0001_init.sql), keyed on the Stripe event id, so a
 * retried/duplicate delivery can never double-decrement stock.
 */
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("webhook: STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
  }

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
  }

  const rawBody = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("webhook: signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      await recordOrder(event, stripe);
    }
    // Other event types (payment_failed, disputes, etc.) are accepted but
    // intentionally not handled yet — see DEPLOYMENT.md for how to extend.
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("webhook: processing failed", err);
    // Non-2xx tells Stripe to retry with backoff. Our processing is
    // idempotent, so a retry is always safe.
    return NextResponse.json({ error: "Processing failed." }, { status: 500 });
  }
}

async function recordOrder(event: Stripe.Event, stripe: Stripe) {
  const session = event.data.object as Stripe.Checkout.Session;

  if (session.payment_status !== "paid") {
    return;
  }

  const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
    expand: ["line_items.data.price.product", "customer_details"],
  });

  const items = (fullSession.line_items?.data ?? []).map((line) => {
    const product = line.price?.product as Stripe.Product | undefined;
    const metadata = (product?.metadata ?? {}) as Record<string, string>;
    return {
      product_id: metadata.productId || null,
      variant_id: metadata.variantId || null,
      product_name: product?.name || "Unknown item",
      variant_label: metadata.variantLabel || null,
      sku: metadata.sku || null,
      unit_price_cents: line.price?.unit_amount ?? 0,
      quantity: line.quantity ?? 0,
    };
  });

  const shippingCents = fullSession.shipping_cost?.amount_total ?? 0;
  const taxCents = fullSession.total_details?.amount_tax ?? 0;
  const totalCents = fullSession.amount_total ?? 0;
  const subtotalCents = fullSession.amount_subtotal ?? totalCents - shippingCents - taxCents;

  const payload = {
    event_id: event.id,
    event_type: event.type,
    order_number: fullSession.metadata?.order_number || `ACC-${session.id.slice(-10).toUpperCase()}`,
    stripe_checkout_session_id: fullSession.id,
    stripe_payment_intent_id:
      typeof fullSession.payment_intent === "string"
        ? fullSession.payment_intent
        : (fullSession.payment_intent?.id ?? null),
    customer_email: fullSession.customer_details?.email || "unknown@aircarecrew.shop",
    customer_name: fullSession.customer_details?.name || null,
    shipping_address: (fullSession.shipping_details?.address ?? null) as Json,
    billing_address: (fullSession.customer_details?.address ?? null) as Json,
    subtotal_cents: subtotalCents,
    shipping_cents: shippingCents,
    tax_cents: taxCents,
    total_cents: totalCents,
    currency: fullSession.currency || "usd",
    items,
  };

  const supabase = createAdminClient();
  const { error } = await supabase.rpc("fn_record_stripe_order", { payload });
  if (error) {
    throw error;
  }
}
