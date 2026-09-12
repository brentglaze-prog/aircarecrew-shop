import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for AirCareCrew.shop.",
};

export default function PrivacyPage() {
  return (
    <div className="container-page max-w-2xl py-12">
      <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Privacy Policy</h1>
      <p className="mt-4 text-sm text-graphite-600">Last updated: [Replace with launch date]</p>

      <div className="prose prose-neutral mt-6 max-w-none space-y-4 text-graphite-600">
        <p>
          <strong>[Starter copy — have this reviewed before launch if you want a fully tailored
          policy.]</strong>
        </p>
        <p>
          AirCareCrew.shop (&quot;we&quot;, &quot;us&quot;) collects the information you provide at
          checkout — name, email, shipping address, and payment details — solely to process and
          fulfill your order. Payment is processed by Stripe; we do not store your card details on
          our servers.
        </p>
        <p>
          We use your email to send order confirmations and, if needed, to contact you about your
          order. We do not sell your personal information.
        </p>
        <p>
          We use privacy-conscious analytics to understand site usage in aggregate. We do not use
          third-party advertising trackers.
        </p>
        <p>
          Contact us at the address on our{" "}
          <a href="/contact" className="underline">
            Contact
          </a>{" "}
          page with any privacy questions or requests.
        </p>
      </div>
    </div>
  );
}
