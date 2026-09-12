import Link from "next/link";
import clsx from "clsx";
import type { Category } from "@/lib/types";

export function CategoryTabs({
  categories,
  activeSlug,
}: {
  categories: Category[];
  activeSlug: string | null;
}) {
  return (
    <nav
      aria-label="Product categories"
      className="mt-4 -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0"
    >
      <Link
        href="/shop"
        className={clsx(
          "min-h-[44px] flex-shrink-0 rounded-full border px-4 py-2 text-sm font-medium",
          activeSlug === null
            ? "border-graphite-950 bg-graphite-950 text-offwhite"
            : "border-graphite-950/20 hover:border-graphite-950"
        )}
      >
        All
      </Link>
      {categories.map((c) => (
        <Link
          key={c.id}
          href={`/shop/${c.slug}`}
          className={clsx(
            "min-h-[44px] flex-shrink-0 rounded-full border px-4 py-2 text-sm font-medium",
            activeSlug === c.slug
              ? "border-graphite-950 bg-graphite-950 text-offwhite"
              : "border-graphite-950/20 hover:border-graphite-950"
          )}
        >
          {c.name}
        </Link>
      ))}
    </nav>
  );
}
