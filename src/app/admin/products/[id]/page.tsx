import { notFound } from "next/navigation";
import Link from "next/link";
import { ProductForm } from "@/components/admin/product-form";
import { ProductImagesManager } from "@/components/admin/product-images-manager";
import { updateProduct } from "@/app/admin/products/actions";
import { getAdminContext } from "@/lib/admin-context";
import type { Product, ProductImage, ProductVariant } from "@/lib/types";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const { db } = await getAdminContext();

  const [{ data: rawProduct }, { data: categories }] = await Promise.all([
    db
      .from("products")
      .select("*, variants:product_variants(*), images:product_images(*)")
      .eq("id", id)
      .maybeSingle(),
    db.from("categories").select("*").order("display_order"),
  ]);

  if (!rawProduct) notFound();

  const product = rawProduct as unknown as Product & {
    variants: ProductVariant[];
    images: ProductImage[];
  };

  const boundAction = updateProduct.bind(null, id);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold tracking-tight">Edit product</h1>
        <Link href={`/product/${product.slug}`} target="_blank" className="text-sm underline">
          View on storefront ↗
        </Link>
      </div>

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold">Images</h2>
        <div className="mt-3">
          <ProductImagesManager productId={product.id} images={product.images ?? []} />
        </div>
      </section>

      <section className="mt-10 border-t border-graphite-950/10 pt-8">
        <h2 className="font-display text-lg font-semibold">Details &amp; variants</h2>
        <div className="mt-3">
          <ProductForm
            product={product}
            variants={product.variants ?? []}
            categories={categories ?? []}
            action={boundAction}
          />
        </div>
      </section>
    </div>
  );
}
