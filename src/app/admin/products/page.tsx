import Link from "next/link";
import { getAdminContext } from "@/lib/admin-context";
import { formatCents } from "@/lib/format";
import { ProductRowActions } from "@/components/admin/product-row-actions";
import type { Product } from "@/lib/types";

interface Props {
  searchParams: Promise<{ status?: string }>;
}

const PRODUCT_STATUSES: Product["status"][] = ["draft", "active", "archived"];

export default async function AdminProductsPage({ searchParams }: Props) {
  const { status } = await searchParams;
  const { db } = await getAdminContext();

  let query = db
    .from("products")
    .select("id, name, slug, price_cents, status, is_featured, category:categories(name)")
    .order("display_order", { ascending: true });

  if (status && status !== "all" && (PRODUCT_STATUSES as string[]).includes(status)) {
    query = query.eq("status", status as Product["status"]);
  } else if (!status) {
    query = query.neq("status", "archived");
  }

  const { data: products } = await query;

  const tabs = [
    { key: "", label: "Active & Draft" },
    { key: "active", label: "Active" },
    { key: "draft", label: "Draft" },
    { key: "archived", label: "Archived" },
    { key: "all", label: "All" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold tracking-tight">Products</h1>
        <Link href="/admin/products/new" className="btn-primary">
          New product
        </Link>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.key ? `/admin/products?status=${tab.key}` : "/admin/products"}
            className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm ${
              (status ?? "") === tab.key
                ? "border-graphite-950 bg-graphite-950 text-offwhite"
                : "border-graphite-950/20"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-graphite-950/10">
        <table className="admin-table w-full text-sm">
          <thead className="bg-graphite-950/5">
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Status</th>
              <th>Featured</th>
              <th className="sr-only">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(products ?? []).map((p) => (
              <tr key={p.id} className="border-t border-graphite-950/10">
                <td>
                  <Link href={`/admin/products/${p.id}`} className="font-medium underline">
                    {p.name}
                  </Link>
                </td>
                <td>{(p.category as unknown as { name: string } | null)?.name ?? "—"}</td>
                <td>{formatCents(p.price_cents)}</td>
                <td className="capitalize">{p.status}</td>
                <td>{p.is_featured ? "Yes" : ""}</td>
                <td>
                  <ProductRowActions id={p.id} status={p.status} />
                </td>
              </tr>
            ))}
            {(products ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="p-3 text-graphite-600">
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
