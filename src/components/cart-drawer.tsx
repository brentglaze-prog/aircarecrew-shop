"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart-context";
import { formatCents } from "@/lib/format";

export function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, subtotalCents } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) closeButtonRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeCart();
    }
    if (isOpen) document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, closeCart]);

  async function handleCheckout() {
    setError(null);
    setIsCheckingOut(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Something went wrong starting checkout.");
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong starting checkout.");
      setIsCheckingOut(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Shopping cart">
      <button
        className="absolute inset-0 bg-graphite-950/50"
        aria-label="Close cart"
        onClick={closeCart}
      />
      <div className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-offwhite shadow-xl">
        <div className="flex items-center justify-between border-b border-graphite-950/10 px-5 py-4">
          <h2 className="font-display text-lg font-semibold">Your Cart</h2>
          <button
            ref={closeButtonRef}
            onClick={closeCart}
            className="flex h-11 w-11 items-center justify-center rounded-md"
            aria-label="Close cart"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-graphite-600">Your cart is empty.</p>
            <button onClick={closeCart} className="btn-secondary">
              Continue shopping
            </button>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-graphite-950/10 overflow-y-auto px-5">
              {items.map((item) => (
                <li key={item.variantId} className="flex gap-4 py-4">
                  <div className="relative h-20 w-16 flex-shrink-0 overflow-hidden rounded bg-graphite-800/5">
                    {item.imageUrl && (
                      <Image src={item.imageUrl} alt="" fill sizes="64px" className="object-cover" />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <div className="flex justify-between gap-2">
                      <Link
                        href={`/product/${item.productSlug}`}
                        onClick={closeCart}
                        className="text-sm font-medium hover:text-amber-500"
                      >
                        {item.productName}
                      </Link>
                      <button
                        onClick={() => removeItem(item.variantId)}
                        className="text-xs text-graphite-600 underline"
                        aria-label={`Remove ${item.productName} from cart`}
                      >
                        Remove
                      </button>
                    </div>
                    {item.variantLabel && <p className="text-xs text-graphite-600">{item.variantLabel}</p>}
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <label className="flex items-center gap-2 text-sm">
                        <span className="sr-only">Quantity for {item.productName}</span>
                        <select
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.variantId, Number(e.target.value))}
                          className="h-9 rounded border border-graphite-950/20 bg-offwhite px-2"
                        >
                          {Array.from({ length: Math.min(item.maxQuantity, 10) }, (_, i) => i + 1).map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </label>
                      <span className="text-sm font-semibold">
                        {formatCents(item.unitPriceCents * item.quantity)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-graphite-950/10 px-5 py-4">
              <div className="flex items-center justify-between text-base font-semibold">
                <span>Subtotal</span>
                <span>{formatCents(subtotalCents)}</span>
              </div>
              <p className="mt-1 text-xs text-graphite-600">Shipping and taxes calculated at checkout.</p>
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
              <button
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className="btn-amber mt-4 w-full"
              >
                {isCheckingOut ? "Redirecting to checkout…" : "Checkout"}
              </button>
              <button onClick={closeCart} className="btn-secondary mt-2 w-full">
                Continue shopping
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
