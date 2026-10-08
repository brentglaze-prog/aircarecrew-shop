import Link from "next/link";
import type { Metadata } from "next";
import { getStripe } from "@/lib/stripe";
import { ClearCartOnSuccess } from "@/components/clear-cart-on-success";

export const metadata: Metadata = { title: "Checkout Status" };
export const runtime = "nodejs";

interface Props {
  searchParams: Promise<{ session_id?: string }>;
}

type PaymentState = "paid" | "pending" | "test" | "unverified";

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { session_id } = await searchParams;
  let state: PaymentState = "unverified";
  let orderNumber: string | null = null;

  if (session_id) {
    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(session_id);

      if (!session.livemode) {
        // A test payment must never look like a genuine customer purchase.
        state = "test";
      } else if (session.status === "complete" && session.payment_status === "paid") {
        state = "paid";
        orderNumber = session.metadata?.order_number ?? null;
      } else {
        state = "pending";
      }
    } catch (err) {
      console.error("checkout status: unable to verify Stripe session", err);
    }
  }

  const message = {
    paid: {
      title: "Payment received",
      description: "Your payment has been verified. We are processing your order. Please retain your Stripe payment receipt.",
    },
    pending: {
      title: "Payment not yet confirmed",
      description: "Stripe has not confirmed your payment. Please do not submit another order until its status is resolved.",
    },
    test: {
      title: "Test checkout",
      description: "This transaction was completed in Stripe test mode. No real payment was collected and no merchandise order was placed.",
    },
    unverified: {
      title: "We could not verify your checkout",
      description: "We cannot confirm that a payment was made. Your cart has been kept intact. If you received a payment receipt, please contact us before trying again.",
    },
  }[state];

  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      {state === "paid" && <ClearCartOnSuccess />}
      {state === "paid" ? (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-500">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 13l4 4L19 7" stroke="#f6f4ef" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      ) : null}
      <h1 className="mt-6 font-display text-2xl font-bold tracking-tight sm:text-3xl">
        {message.title}
      </h1>
      {state === "paid" && orderNumber && (
        <p className="mt-2 text-graphite-600">Order {orderNumber}</p>
      )}
      <p className="mt-4 max-w-md text-sm text-graphite-600">
        {message.description}
      </p>
      {state !== "paid" && (
        <Link href="/contact" className="mt-6 text-sm font-semibold text-violet-700 underline">
          Contact the store
        </Link>
      )}
      <Link href="/shop" className="btn-primary mt-8">
        Continue shopping
      </Link>
    </div>
  );
}
