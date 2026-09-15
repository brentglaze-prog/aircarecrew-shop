import { notFound } from "next/navigation";
import Link from "next/link";
import { ProductForm } from "@/components/admin/product-form";
import { ProductImagesManager } from "@/components/admin/product-images-manager";
import { VendorSourceForm } from "@/components/admin/vendor-source-form";
import { SupplierAvailabilityPanel } from "@/components/admin/supplier-availability-panel";
import { updateProduct } from "@/app/admin/products/actions";
import { getAdminContext } from "@/lib/admin-context";
import type {
  Product,
  ProductImage,
  ProductVendorLink,
  SupplierAwareVariant,
} from "@/lib/types";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const { db } = await getAdminContext();

  const [{ data: rawProduct }, { data: categories }, { data: vendor }] = await Promise.all([
    db
      .from("products")
      .select("*, variants:product_variants(*), images:product_images(*)")
      .eq("id", id)
      .maybeSingle(),
    db.from("categories").select("*").order("display_order"),
    db.from("product_vendor_links").select("*").eq("product_id", id).maybeSingle(),
  ]);

  if (!rawProduct) notFound();

  const product = rawProduct as unknown as Product & {
    variants: SupplierAwareVariant[];
    images: ProductImage[];
  };
  const vendorSource = (vendor as ProductVendorLink | null) ?? null;
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
        <h2 className="font-display text-lg font-semibold">Product renders &amp; images</h2>
        <p className="mt-1 text-sm text-graphite-600">
          Upload vendor mockups, clean product renders, detail shots, or lifestyle images. Set the strongest render as Primary.
        </p>
        <div className="mt-3">
          <ProductImagesManager productId={product.id} images={product.images ?? []} />
        </div>
      </section>

      <section className="mt-10 border-t border-graphite-950/10 pt-8">
        <h2 className="font-display text-lg font-semibold">Sourcing</h2>
        <div className="mt-3 space-y-4">
          <VendorSourceForm productId={product.id} vendor={vendorSource} />
          <SupplierAvailabilityPanel
            productId={product.id}
            variants={product.variants ?? []}
            vendorUrl={vendorSource?.vendor_product_url}
          />
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
