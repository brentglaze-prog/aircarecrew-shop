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
      <section className="relative overflow-hidden border-t-4 border-careblue-500 bg-navy-950 text-offwhite">
        <div className="pointer-events-none absolute right-[-7rem] top-[-9rem] h-80 w-80 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-8rem] left-[35%] h-64 w-64 rounded-full bg-careblue-500/15 blur-3xl" />
        <div className="container-page relative flex flex-col items-start gap-6 py-14 sm:py-20">
          <div className="h-1 w-16 rounded-full bg-violet-400" aria-hidden="true" />
          <h1 className="max-w-xl font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Gear for the Crew.
          </h1>
          <p className="max-w-md text-careblue-200/80">
            Premium shirts and hats for air medical and HEMS crewmembers. Independently operated,
            built for the job.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/shop/shirts" className="btn-violet">
              Shop Shirts
            </Link>
            <Link
              href="/shop/hats"
              className="btn border border-careblue-300/50 text-offwhite hover:bg-careblue-500/10"
            >
              Shop Hats
            </Link>
          </div>
        </div>
      </section>

      <section className="container-page py-10 sm:py-14">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">Featured</h2>
          <Link href="/shop" className="text-sm font-medium text-careblue-700 underline">
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
            {categories.map((c, index) => (
              <Link
                key={c.id}
                href={`/shop/${c.slug}`}
                className="group relative flex h-40 items-end overflow-hidden rounded-lg bg-graphite-800 p-6 text-offwhite"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-graphite-950/90 to-transparent" />
                <div
                  className={`absolute left-0 top-0 h-1 w-full ${index % 2 === 0 ? "bg-violet-400" : "bg-careblue-500"}`}
                  aria-hidden="true"
                />
                <span className="relative font-display text-xl font-semibold tracking-tight">
                  {c.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="border-t border-careblue-500/20 bg-offwhite py-14">
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
