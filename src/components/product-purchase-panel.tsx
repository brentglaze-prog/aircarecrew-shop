"use client";

import { useMemo, useState } from "react";
import { useCart } from "@/lib/cart-context";
import { formatCents, variantLabel } from "@/lib/format";
import type { ProductWithRelations } from "@/lib/types";

export function ProductPurchasePanel({ product }: { product: ProductWithRelations }) {
  const { addItem, openCart } = useCart();

  const sizes = useMemo(
    () => Array.from(new Set(product.variants.map((v) => v.size).filter((s): s is string => !!s))),
    [product.variants]
  );
  const colors = useMemo(
    () => Array.from(new Set(product.variants.map((v) => v.color).filter((c): c is string => !!c))),
    [product.variants]
  );

  const [selectedSize, setSelectedSize] = useState<string | null>(sizes[0] ?? null);
  const [selectedColor, setSelectedColor] = useState<string | null>(colors[0] ?? null);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const selectedVariant = useMemo(
    () =>
      product.variants.find(
        (v) => (v.size ?? null) === (selectedSize ?? null) && (v.color ?? null) === (selectedColor ?? null)
      ) ?? null,
    [product.variants, selectedSize, selectedColor]
  );

  // A given size/color option is only offered if some active, in-stock
  // variant exists for it given the other current selection — this is what
  // "do not allow impossible variant combinations" means in the UI.
  function isSizeAvailable(size: string) {
    return product.variants.some(
      (v) => v.size === size && (colors.length === 0 || (v.color ?? null) === (selectedColor ?? null))
    );
  }
  function isColorAvailable(color: string) {
    return product.variants.some(
      (v) => v.color === color && (sizes.length === 0 || (v.size ?? null) === (selectedSize ?? null))
    );
  }

  const inStock = (selectedVariant?.inventory_quantity ?? 0) > 0;
  const primaryImage = product.images.find((i) => i.is_primary) ?? product.images[0];

  function handleAddToCart() {
    if (!selectedVariant || !inStock) return;
    addItem({
      variantId: selectedVariant.id,
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      variantLabel: variantLabel(selectedVariant.size, selectedVariant.color),
      sku: selectedVariant.sku,
      unitPriceCents: product.price_cents,
      quantity,
      imageUrl: primaryImage?.url ?? null,
      maxQuantity: selectedVariant.inventory_quantity,
    });
    setJustAdded(true);
    openCart();
    setTimeout(() => setJustAdded(false), 2000);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{product.name}</h1>
        <p className="mt-2 flex items-baseline gap-2 text-lg">
          <span className="font-semibold">{formatCents(product.price_cents)}</span>
          {product.compare_at_price_cents && product.compare_at_price_cents > product.price_cents && (
            <span className="text-graphite-600 line-through">{formatCents(product.compare_at_price_cents)}</span>
          )}
        </p>
      </div>

      {product.short_description && <p className="text-graphite-600">{product.short_description}</p>}

      {colors.length > 0 && (
        <fieldset>
          <legend className="text-sm font-semibold">Color{selectedColor ? `: ${selectedColor}` : ""}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {colors.map((color) => {
              const available = isColorAvailable(color);
              return (
                <button
                  key={color}
                  type="button"
                  disabled={!available}
                  onClick={() => setSelectedColor(color)}
                  aria-pressed={selectedColor === color}
                  className={`min-h-[44px] rounded-md border px-4 text-sm font-medium transition-colors ${
                    selectedColor === color
                      ? "border-graphite-950 bg-graphite-950 text-offwhite"
                      : "border-graphite-950/20 hover:border-graphite-950"
                  } ${!available ? "cursor-not-allowed opacity-40" : ""}`}
                >
                  {color}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {sizes.length > 0 && (
        <fieldset>
          <legend className="text-sm font-semibold">Size{selectedSize ? `: ${selectedSize}` : ""}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {sizes.map((size) => {
              const available = isSizeAvailable(size);
              return (
                <button
                  key={size}
                  type="button"
                  disabled={!available}
                  onClick={() => setSelectedSize(size)}
                  aria-pressed={selectedSize === size}
                  className={`min-h-[44px] min-w-[44px] rounded-md border px-3 text-sm font-medium transition-colors ${
                    selectedSize === size
                      ? "border-graphite-950 bg-graphite-950 text-offwhite"
                      : "border-graphite-950/20 hover:border-graphite-950"
                  } ${!available ? "cursor-not-allowed opacity-40" : ""}`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <div>
        <p className="text-sm font-medium">
          {selectedVariant
            ? inStock
              ? selectedVariant.inventory_quantity <= 5
                ? `Only ${selectedVariant.inventory_quantity} left`
                : "In stock"
              : "Out of stock in this size/color"
            : "Select options"}
        </p>
      </div>

      <div className="flex items-stretch gap-3">
        <label className="flex items-center gap-2">
          <span className="sr-only">Quantity</span>
          <select
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            disabled={!inStock}
            className="h-[52px] rounded-md border border-graphite-950/20 bg-offwhite px-3 text-sm"
          >
            {Array.from({ length: Math.min(selectedVariant?.inventory_quantity ?? 1, 10) }, (_, i) => i + 1).map(
              (n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              )
            )}
          </select>
        </label>
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!selectedVariant || !inStock}
          className="btn-violet flex-1"
        >
          {justAdded ? "Added ✓" : inStock ? "Add to Cart" : "Sold Out"}
        </button>
      </div>

      <div className="rounded-md border border-graphite-950/10 bg-graphite-950/[0.03] p-4 text-sm text-graphite-600">
        <p className="font-medium text-graphite-950">Shipping &amp; Returns</p>
        <p className="mt-1">
          Ships within 2 business days. Free shipping may apply above our threshold at checkout. Returns
          accepted within 30 days — see our{" "}
          <a href="/shipping-returns" className="underline">
            Shipping &amp; Returns
          </a>{" "}
          page for details.
        </p>
      </div>
    </div>
  );
}
