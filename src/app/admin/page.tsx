import Link from "next/link";
import { getAdminContext } from "@/lib/admin-context";
import { formatCents } from "@/lib/format";

export default async function AdminDashboardPage() {
  const { db } = await getAdminContext();

  const [{ count: productCount }, { count: orderCount }, { data: recentOrders }, { data: lowStock }] =
    await Promise.all([
      db.from("products").select("id", { count: "exact", head: true }).neq("status", "archived"),
      db.from("orders").select("id", { count: "exact", head: true }),
      db
        .from("orders")
        .select("id, order_number, customer_email, total_cents, payment_status, fulfillment_status, created_at")
        .order("created_at", { ascending: false })
        .limit(8),
      db
        .from("product_variants")
        .select("id, sku, inventory_quantity, product:products(name)")
        .lte("inventory_quantity", 5)
        .eq("is_active", true)
        .order("inventory_quantity", { ascending: true })
        .limit(8),
    ]);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight">Dashboard</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Active/draft products" value={productCount ?? 0} href="/admin/products" />
        <StatCard label="Total orders" value={orderCount ?? 0} href="/admin/orders" />
        <StatCard label="Low stock variants" value={lowStock?.length ?? 0} href="/admin/products" />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="font-display text-lg font-semibold">Recent orders</h2>
          <div className="mt-3 overflow-x-auto rounded-lg border border-graphite-950/10">
            <table className="w-full text-sm">
              <thead className="bg-graphite-950/5 text-left">
                <tr>
                  <th className="p-3">Order</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {(recentOrders ?? []).map((o) => (
                  <tr key={o.id} className="border-t border-graphite-950/10">
                    <td className="p-3">
                      <Link href={`/admin/orders/${o.id}`} className="font-medium underline">
                        {o.order_number}
                      </Link>
                    </td>
                    <td className="p-3">{o.customer_email}</td>
                    <td className="p-3">{formatCents(o.total_cents)}</td>
                    <td className="p-3 capitalize">{o.fulfillment_status}</td>
                  </tr>
                ))}
                {(recentOrders ?? []).length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-3 text-graphite-600">
                      No orders yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold">Low stock (≤ 5)</h2>
          <div className="mt-3 overflow-x-auto rounded-lg border border-graphite-950/10">
            <table className="w-full text-sm">
              <thead className="bg-graphite-950/5 text-left">
                <tr>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Product</th>
                  <th className="p-3">Stock</th>
                </tr>
              </thead>
              <tbody>
                {(lowStock ?? []).map((v) => (
                  <tr key={v.id} className="border-t border-graphite-950/10">
                    <td className="p-3 font-mono text-xs">{v.sku}</td>
                    <td className="p-3">{(v.product as unknown as { name: string })?.name}</td>
                    <td className="p-3">{v.inventory_quantity}</td>
                  </tr>
                ))}
                {(lowStock ?? []).length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-3 text-graphite-600">
                      Nothing low on stock.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="rounded-lg border border-graphite-950/10 p-5 hover:border-graphite-950/30">
      <p className="text-sm text-graphite-600">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold">{value}</p>
    </Link>
  );
}
