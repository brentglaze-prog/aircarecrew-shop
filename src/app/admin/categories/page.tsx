import Link from "next/link";
import { getAdminContext } from "@/lib/admin-context";
import { DeleteCategoryButton } from "@/components/admin/delete-category-button";

export default async function AdminCategoriesPage() {
  const { db } = await getAdminContext();

  const { data: categories } = await db
    .from("categories")
    .select("*, products:products(count)")
    .order("display_order", { ascending: true });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold tracking-tight">Categories</h1>
        <Link href="/admin/categories/new" className="btn-primary">
          New category
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-graphite-950/10">
        <table className="admin-table w-full text-sm">
          <thead className="bg-graphite-950/5">
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Products</th>
              <th>Visible</th>
              <th>Order</th>
              <th className="sr-only">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(categories ?? []).map((c) => {
              const productCount = (c.products as unknown as { count: number }[])?.[0]?.count ?? 0;
              return (
                <tr key={c.id} className="border-t border-graphite-950/10">
                  <td className="font-medium">{c.name}</td>
                  <td className="font-mono text-xs">{c.slug}</td>
                  <td>{productCount}</td>
                  <td>{c.is_visible ? "Yes" : "No"}</td>
                  <td>{c.display_order}</td>
                  <td>
                    <div className="flex justify-end gap-3">
                      <Link href={`/admin/categories/${c.id}`} className="text-sm underline">
                        Edit
                      </Link>
                      <DeleteCategoryButton id={c.id} name={c.name} productCount={productCount} />
                    </div>
                  </td>
                </tr>
              );
            })}
            {(categories ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="p-3 text-graphite-600">
                  No categories yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
