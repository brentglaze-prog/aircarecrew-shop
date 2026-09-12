import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for AirCareCrew.shop.",
};

export default function TermsPage() {
  return (
    <div className="container-page max-w-2xl py-12">
      <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Terms of Service</h1>
      <p className="mt-4 text-sm text-graphite-600">Last updated: [Replace with launch date]</p>

      <div className="prose prose-neutral mt-6 max-w-none space-y-4 text-graphite-600">
        <p>
          <strong>[Starter copy — have this reviewed before launch if you want fully tailored
          terms.]</strong>
        </p>
        <p>
          By placing an order on AirCareCrew.shop you agree to these terms. Product descriptions
          and images are provided in good faith; minor variations in color or print placement may
          occur. Prices are shown in USD and may change without notice.
        </p>
        <p>
          AirCareCrew.shop is an independently operated store and is not an official merchandise
          outlet of, and is not affiliated with or endorsed by, any hospital system, air ambulance
          operator, or employer.
        </p>
        <p>
          See our{" "}
          <a href="/shipping-returns" className="underline">
            Shipping &amp; Returns
          </a>{" "}
          page for order fulfillment and return terms.
        </p>
      </div>
    </div>
  );
}
