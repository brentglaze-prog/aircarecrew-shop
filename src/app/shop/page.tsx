import type { Metadata } from "next";
import { ProductCard } from "@/components/product-card";
import { getActiveProducts, getVisibleCategories } from "@/lib/queries";
import { CategoryTabs } from "@/components/category-tabs";

export const metadata: Metadata = {
  title: "All Products",
  description: "Shop all AirCareCrew.shop merchandise — shirts, hats, and more.",
};

export const revalidate = 60;

export default async function ShopPage() {
  const [products, categories] = await Promise.all([getActiveProducts(), getVisibleCategories()]);

  return (
    <div className="container-page py-8 sm:py-12">
      <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">All Products</h1>
      <CategoryTabs categories={categories} activeSlug={null} />

      {products.length === 0 ? (
        <p className="mt-8 text-graphite-600">No products yet.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
