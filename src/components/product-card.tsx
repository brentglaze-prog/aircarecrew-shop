import Image from "next/image";
import Link from "next/link";
import { formatCents } from "@/lib/format";
import { isSoldOut, type ProductCardData } from "@/lib/types";

export function ProductCard({ product }: { product: ProductCardData }) {
  const primaryImage = [...product.images].sort((a, b) => Number(b.is_primary) - Number(a.is_primary))[0];
  const soldOut = isSoldOut(product.variants);

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group block rounded-lg focus-visible:outline-offset-4"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-graphite-100 bg-graphite-800/5">
        {primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={primaryImage.alt_text ?? product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-graphite-600">
            No image yet
          </div>
        )}
        {soldOut && (
          <span className="absolute left-3 top-3 rounded bg-graphite-950 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-offwhite">
            Sold out
          </span>
        )}
        {!soldOut && product.compare_at_price_cents && product.compare_at_price_cents > product.price_cents && (
          <span className="absolute left-3 top-3 rounded bg-amber-500 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-graphite-950">
            Sale
          </span>
        )}
      </div>
      <div className="mt-3">
        <h3 className="text-sm font-semibold text-graphite-950">{product.name}</h3>
        <p className="mt-1 flex items-baseline gap-2 text-sm">
          <span className="font-semibold">{formatCents(product.price_cents)}</span>
          {product.compare_at_price_cents && product.compare_at_price_cents > product.price_cents && (
            <span className="text-graphite-600 line-through">{formatCents(product.compare_at_price_cents)}</span>
          )}
        </p>
      </div>
    </Link>
  );
}
