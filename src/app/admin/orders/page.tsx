import Link from "next/link";
import { getAdminContext } from "@/lib/admin-context";
import { formatCents } from "@/lib/format";
import type { Order } from "@/lib/types";

interface Props {
  searchParams: Promise<{ fulfillment?: string }>;
}

const STATUSES: Order["fulfillment_status"][] = [
  "unfulfilled",
  "processing",
  "shipped",
  "completed",
  "cancelled",
];

export default async function AdminOrdersPage({ searchParams }: Props) {
  const { fulfillment } = await searchParams;
  const { db } = await getAdminContext();

  let query = db
    .from("orders")
    .select("id, order_number, customer_email, customer_name, total_cents, payment_status, fulfillment_status, created_at")
    .order("created_at", { ascending: false });

  if (fulfillment && (STATUSES as string[]).includes(fulfillment)) {
    query = query.eq("fulfillment_status", fulfillment as Order["fulfillment_status"]);
  }

  const { data: orders } = await query;

  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight">Orders</h1>

      <div className="mt-4 flex gap-2 overflow-x-auto">
        <Link
          href="/admin/orders"
          className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm ${
            !fulfillment ? "border-graphite-950 bg-graphite-950 text-offwhite" : "border-graphite-950/20"
          }`}
        >
          All
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/orders?fulfillment=${s}`}
            className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm capitalize ${
              fulfillment === s ? "border-graphite-950 bg-graphite-950 text-offwhite" : "border-graphite-950/20"
            }`}
          >
            {s}
          </Link>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-graphite-950/10">
        <table className="admin-table w-full text-sm">
          <thead className="bg-graphite-950/5">
            <tr>
              <th>Order</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Fulfillment</th>
            </tr>
          </thead>
          <tbody>
            {(orders ?? []).map((o) => (
              <tr key={o.id} className="border-t border-graphite-950/10">
                <td>
                  <Link href={`/admin/orders/${o.id}`} className="font-medium underline">
                    {o.order_number}
                  </Link>
                </td>
                <td>{new Date(o.created_at).toLocaleDateString()}</td>
                <td>{o.customer_name || o.customer_email}</td>
                <td>{formatCents(o.total_cents)}</td>
                <td className="capitalize">{o.payment_status}</td>
                <td className="capitalize">{o.fulfillment_status}</td>
              </tr>
            ))}
            {(orders ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="p-3 text-graphite-600">
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
