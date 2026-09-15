import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { getActiveProducts, getVisibleCategories } from "@/lib/queries";

export default async function HomePage() {
  const [categories, featured] = await Promise.all([
    getVisibleCategories(),
    getActiveProducts({ featuredOnly: true, limit: 8 }),
  ]);

  return (
    <div>
      <section className="bg-navy-950 text-offwhite">
        <div className="container-page flex flex-col items-start gap-6 py-14 sm:py-20">
          <h1 className="max-w-xl font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Gear for the Crew.
          </h1>
          <p className="max-w-md text-graphite-600">
            Premium shirts and hats for air medical and HEMS crewmembers. Independently operated,
            built for the job.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/shop/shirts" className="btn-violet">
              Shop Shirts
            </Link>
            <Link
              href="/shop/hats"
              className="btn border border-offwhite/30 text-offwhite hover:bg-offwhite/10"
            >
              Shop Hats
            </Link>
          </div>
        </div>
      </section>

      <section className="container-page py-10 sm:py-14">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">Featured</h2>
          <Link href="/shop" className="text-sm font-medium underline">
            Shop all
          </Link>
        </div>

        {featured.length === 0 ? (
          <p className="text-graphite-600">
            No products yet — add some from{" "}
            <Link href="/admin/products" className="underline">
              Admin → Products
            </Link>
            .
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {categories.length > 0 && (
        <section className="container-page pb-14">
          <div className="grid gap-4 sm:grid-cols-2">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/shop/${c.slug}`}
                className="group relative flex h-40 items-end overflow-hidden rounded-lg bg-graphite-800 p-6 text-offwhite"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-graphite-950/80 to-transparent" />
                <span className="relative font-display text-xl font-semibold tracking-tight">
                  {c.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="border-t border-graphite-950/10 bg-offwhite py-14">
        <div className="container-page max-w-2xl text-center">
          <h2 className="font-display text-xl font-bold tracking-tight">Built for the job, not the gym</h2>
          <p className="mt-3 text-graphite-600">
            AirCareCrew.shop makes understated, durable gear for the flight and ground crews who work
            long shifts in tight spaces. No gimmicks — just clean designs that hold up.
          </p>
        </div>
      </section>
    </div>
  );
}
