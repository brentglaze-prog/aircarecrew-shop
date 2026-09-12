import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductPurchasePanel } from "@/components/product-purchase-panel";
import { ProductGallery } from "@/components/product-gallery";
import { getProductBySlug } from "@/lib/queries";

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  const image = product.images[0]?.url;
  return {
    title: product.seo_title || product.name,
    description: product.seo_description || product.short_description || undefined,
    openGraph: image ? { images: [image] } : undefined,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const inStockOverall = product.variants.some((v) => v.inventory_quantity > 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.short_description ?? product.description ?? undefined,
    image: product.images.map((i) => i.url),
    sku: product.variants[0]?.sku,
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: (product.price_cents / 100).toFixed(2),
      availability: inStockOverall
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://aircarecrew.shop"}/product/${product.slug}`,
    },
  };

  return (
    <div className="container-page py-8 sm:py-12">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <ProductGallery images={product.images} productName={product.name} />
        <ProductPurchasePanel product={product} />
      </div>

      {product.description && (
        <div className="mt-12 max-w-3xl border-t border-graphite-950/10 pt-8">
          <h2 className="font-display text-lg font-semibold">Description</h2>
          <p className="mt-3 whitespace-pre-line text-graphite-600">{product.description}</p>
        </div>
      )}
    </div>
  );
}
