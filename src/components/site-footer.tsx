import Link from "next/link";
import type { Category, StoreSettings } from "@/lib/types";

export function SiteFooter({
  categories,
  settings,
}: {
  categories: Category[];
  settings: StoreSettings | null;
}) {
  const social = (settings?.social_links ?? {}) as Record<string, string>;

  return (
    <footer className="border-t border-graphite-950/10 bg-graphite-950 text-offwhite">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-lg font-bold tracking-tight">
            AirCare<span className="text-violet-300">Crew</span>.shop
          </p>
          <p className="mt-3 text-sm text-graphite-600">Gear for the crew.</p>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-graphite-600">Shop</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/shop" className="hover:text-violet-200">
                All Products
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.id}>
                <Link href={`/shop/${c.slug}`} className="hover:text-violet-200">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-graphite-600">Info</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/about" className="hover:text-violet-200">
                About
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-violet-200">
                Contact
              </Link>
            </li>
            <li>
              <Link href="/shipping-returns" className="hover:text-violet-200">
                Shipping &amp; Returns
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-graphite-600">Legal</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/privacy" className="hover:text-violet-200">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-violet-200">
                Terms of Service
              </Link>
            </li>
          </ul>
          {(social.instagram || social.facebook) && (
            <div className="mt-4 flex gap-4 text-sm">
              {social.instagram && (
                <a href={social.instagram} className="hover:text-violet-200" rel="noreferrer" target="_blank">
                  Instagram
                </a>
              )}
              {social.facebook && (
                <a href={social.facebook} className="hover:text-violet-200" rel="noreferrer" target="_blank">
                  Facebook
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-offwhite/10">
        <p className="container-page py-4 text-center text-xs leading-relaxed text-graphite-600">
          {settings?.footer_text ||
            "AirCareCrew.shop is an independently operated crew merchandise store and is not an official merchandise outlet of any employer or air-medical operator."}
        </p>
        <p className="container-page pb-4 text-center text-xs text-graphite-600">
          © {new Date().getFullYear()} AirCareCrew.shop. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
