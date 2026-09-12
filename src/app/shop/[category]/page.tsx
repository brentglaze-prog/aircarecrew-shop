import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { CategoryTabs } from "@/components/category-tabs";
import { getActiveProducts, getCategoryBySlug, getVisibleCategories } from "@/lib/queries";

export const revalidate = 60;

interface Props {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  return {
    title: category.name,
    description: category.description ?? `Shop ${category.name} from AirCareCrew.shop.`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category: slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const [products, categories] = await Promise.all([
    getActiveProducts({ categoryId: category.id }),
    getVisibleCategories(),
  ]);

  return (
    <div className="container-page py-8 sm:py-12">
      <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{category.name}</h1>
      {category.description && <p className="mt-2 max-w-2xl text-graphite-600">{category.description}</p>}
      <CategoryTabs categories={categories} activeSlug={category.slug} />

      {products.length === 0 ? (
        <p className="mt-8 text-graphite-600">No products in this category yet.</p>
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
