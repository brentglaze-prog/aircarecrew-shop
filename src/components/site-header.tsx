"use client";

import Link from "next/link";
import { useState } from "react";
import type { Category, StoreSettings } from "@/lib/types";
import { useCart } from "@/lib/cart-context";

export function SiteHeader({
  categories,
  settings,
}: {
  categories: Category[];
  settings: StoreSettings | null;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { itemCount, openCart } = useCart();

  return (
    <div className="sticky top-0 z-40 bg-graphite-950 text-offwhite">
      {settings?.announcement_bar_enabled && settings.announcement_bar_text ? (
        <div className="bg-amber-500 px-4 py-2 text-center text-xs font-semibold tracking-wide text-graphite-950">
          {settings.announcement_bar_text}
        </div>
      ) : null}

      <header className="container-page flex h-16 items-center justify-between gap-4">
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-md md:hidden"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            {menuOpen ? (
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            )}
          </svg>
        </button>

        <Link href="/" className="font-display text-lg font-bold tracking-tight">
          AirCare<span className="text-amber-500">Crew</span>
          <span className="text-graphite-600">.shop</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          <Link href="/shop" className="text-sm font-medium hover:text-amber-400">
            All Products
          </Link>
          {categories.map((c) => (
            <Link key={c.id} href={`/shop/${c.slug}`} className="text-sm font-medium hover:text-amber-400">
              {c.name}
            </Link>
          ))}
          <Link href="/about" className="text-sm font-medium hover:text-amber-400">
            About
          </Link>
        </nav>

        <button
          type="button"
          onClick={openCart}
          className="relative flex h-11 min-w-[44px] items-center justify-center rounded-md px-2"
          aria-label={`Cart, ${itemCount} item${itemCount === 1 ? "" : "s"}`}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M6 6h15l-1.5 9h-12L6 6Zm0 0L5 3H2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="9" cy="20" r="1.4" fill="currentColor" />
            <circle cx="17" cy="20" r="1.4" fill="currentColor" />
          </svg>
          {itemCount > 0 && (
            <span className="absolute right-0 top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500 px-1 text-[11px] font-bold text-graphite-950">
              {itemCount}
            </span>
          )}
        </button>
      </header>

      {menuOpen && (
        <nav
          className="container-page flex flex-col gap-1 border-t border-offwhite/10 pb-4 md:hidden"
          aria-label="Mobile"
        >
          <Link
            href="/shop"
            className="min-h-[44px] rounded-md px-2 py-3 text-base font-medium"
            onClick={() => setMenuOpen(false)}
          >
            All Products
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/shop/${c.slug}`}
              className="min-h-[44px] rounded-md px-2 py-3 text-base font-medium"
              onClick={() => setMenuOpen(false)}
            >
              {c.name}
            </Link>
          ))}
          <Link
            href="/about"
            className="min-h-[44px] rounded-md px-2 py-3 text-base font-medium"
            onClick={() => setMenuOpen(false)}
          >
            About
          </Link>
          <Link
            href="/contact"
            className="min-h-[44px] rounded-md px-2 py-3 text-base font-medium"
            onClick={() => setMenuOpen(false)}
          >
            Contact
          </Link>
        </nav>
      )}
    </div>
  );
}
