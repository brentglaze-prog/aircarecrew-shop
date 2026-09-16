import Image from "next/image";
import Link from "next/link";
import { formatCents } from "@/lib/format";
import { productAvailability, type ProductCardData } from "@/lib/types";

export function ProductCard({ product }: { product: ProductCardData }) {
  const primaryImage = [...product.images].sort((a, b) => Number(b.is_primary) - Number(a.is_primary))[0];
  const availability = productAvailability(product.variants);
  const unavailable = availability !== "available";

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group block rounded-lg focus-visible:outline-offset-4"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-offwhite">
        {primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={primaryImage.alt_text ?? product.name}
            fill
            unoptimized
            sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-contain p-3 transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-graphite-600">
            No image yet
          </div>
        )}
        {availability === "sold_out" && (
          <span className="absolute left-3 top-3 rounded bg-graphite-950 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-offwhite">
            Sold out
          </span>
        )}
        {availability === "verification_required" && (
          <span className="absolute left-3 top-3 rounded bg-careblue-700 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-offwhite">
            Availability check
          </span>
        )}
        {!unavailable && product.compare_at_price_cents && product.compare_at_price_cents > product.price_cents && (
          <span className="absolute left-3 top-3 rounded bg-violet-500 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-offwhite">
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