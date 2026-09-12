import { ProductForm } from "@/components/admin/product-form";
import { createProduct } from "@/app/admin/products/actions";
import { getAdminContext } from "@/lib/admin-context";

export default async function NewProductPage() {
  const { db } = await getAdminContext();
  const { data: categories } = await db.from("categories").select("*").order("display_order");

  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight">New product</h1>
      <p className="mt-1 text-sm text-graphite-600">
        Save the product first, then upload images from the edit screen.
      </p>
      <div className="mt-6">
        <ProductForm categories={categories ?? []} action={createProduct} />
      </div>
    </div>
  );
}
