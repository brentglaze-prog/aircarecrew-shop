import type { Metadata } from "next";
import { getStoreSettings } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with AirCareCrew.shop.",
};

export default async function ContactPage() {
  const settings = await getStoreSettings();
  const email = settings?.store_email || "hello@aircarecrew.shop";

  return (
    <div className="container-page max-w-2xl py-12">
      <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Contact</h1>
      <p className="mt-6 text-graphite-600">
        Questions about an order, sizing, or a bulk/group order for your crew? Reach out and we&apos;ll
        get back to you as soon as we can.
      </p>
      <a href={`mailto:${email}`} className="btn-primary mt-6 inline-flex">
        Email {email}
      </a>
    </div>
  );
}
