import type { Metadata } from "next";
import { getStoreSettings } from "@/lib/queries";
import { formatCents } from "@/lib/format";

export const metadata: Metadata = {
  title: "Shipping & Returns",
  description: "Shipping rates and return policy for AirCareCrew.shop.",
};

export default async function ShippingReturnsPage() {
  const settings = await getStoreSettings();

  return (
    <div className="container-page max-w-2xl py-12">
      <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Shipping &amp; Returns</h1>

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold">Shipping</h2>
        <p className="mt-2 text-graphite-600">
          Orders ship within 2 business days. Flat-rate shipping is{" "}
          {formatCents(settings?.default_shipping_cents ?? 795)}
          {settings?.free_shipping_threshold_cents
            ? `, free on orders over ${formatCents(settings.free_shipping_threshold_cents)}.`
            : "."}
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold">Returns</h2>
        <p className="mt-2 whitespace-pre-line text-graphite-600">
          {settings?.return_policy_summary ||
            "Returns accepted within 30 days of delivery on unworn, unwashed items with tags attached. Contact us to start a return."}
        </p>
      </section>

      <p className="mt-8 text-sm text-graphite-600">
        This page provides general information only and is not a legal guarantee. Contact us with
        questions about a specific order.
      </p>
    </div>
  );
}
