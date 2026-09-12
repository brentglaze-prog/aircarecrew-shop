import Link from "next/link";
import type { Metadata } from "next";
import { getStripe } from "@/lib/stripe";
import { ClearCartOnSuccess } from "@/components/clear-cart-on-success";

export const metadata: Metadata = { title: "Order Confirmed" };
export const runtime = "nodejs";

interface Props {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { session_id } = await searchParams;
  let email: string | null = null;
  let orderNumber: string | null = null;

  if (session_id) {
    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(session_id);
      email = session.customer_details?.email ?? null;
      orderNumber = (session.metadata?.order_number as string | undefined) ?? null;
    } catch (err) {
      console.error("checkout success: failed to retrieve session", err);
    }
  }

  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <ClearCartOnSuccess />
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 13l4 4L19 7" stroke="#111318" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h1 className="mt-6 font-display text-2xl font-bold tracking-tight sm:text-3xl">Thank you for your order</h1>
      {orderNumber && <p className="mt-2 text-graphite-600">Order {orderNumber}</p>}
      {email && (
        <p className="mt-1 text-graphite-600">A confirmation has been sent to {email}.</p>
      )}
      <p className="mt-4 max-w-md text-sm text-graphite-600">
        We&apos;ll get your gear packed up and shipped within 2 business days.
      </p>
      <Link href="/shop" className="btn-primary mt-8">
        Continue shopping
      </Link>
    </div>
  );
}
