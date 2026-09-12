import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "About AirCareCrew.shop — independently operated crew merchandise.",
};

export default function AboutPage() {
  return (
    <div className="container-page max-w-2xl py-12">
      <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">About</h1>
      <div className="prose prose-neutral mt-6 max-w-none text-graphite-600">
        <p>
          AirCareCrew.shop makes understated, durable merchandise for air medical and HEMS
          crewmembers — the people who work long shifts in tight spaces and don&apos;t need
          another loud, gimmicky gym-brand tee.
        </p>
        <p>
          We keep the lineup small and the quality high: a handful of shirts and hats, built to
          hold up, priced fairly.
        </p>
        <p className="text-sm">
          <strong>AirCareCrew.shop is independently operated.</strong> We are not an official
          merchandise outlet of any hospital system, air ambulance operator, or employer, and we
          are not affiliated with or endorsed by any specific air medical company.
        </p>
      </div>
    </div>
  );
}
