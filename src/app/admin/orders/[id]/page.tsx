import { notFound } from "next/navigation";
import { getAdminContext } from "@/lib/admin-context";
import { formatCents } from "@/lib/format";
import { updateFulfillment } from "@/app/admin/orders/actions";

interface Props {
  params: Promise<{ id: string }>;
}

const STATUSES = ["unfulfilled", "processing", "shipped", "completed", "cancelled"];

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const { db } = await getAdminContext();

  const [{ data: order }, { data: items }] = await Promise.all([
    db.from("orders").select("*").eq("id", id).maybeSingle(),
    db.from("order_items").select("*").eq("order_id", id),
  ]);

  if (!order) notFound();

  const shipping = order.shipping_address as Record<string, string> | null;

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h1 className="font-display text-2xl font-bold tracking-tight">Order {order.order_number}</h1>
        <p className="mt-1 text-sm text-graphite-600">
          Placed {new Date(order.created_at).toLocaleString()}
        </p>

        <div className="mt-6 overflow-x-auto rounded-lg border border-graphite-950/10">
          <table className="admin-table w-full text-sm">
            <thead className="bg-graphite-950/5">
              <tr>
                <th>Item</th>
                <th>SKU</th>
                <th>Qty</th>
                <th>Unit price</th>
                <th>Line total</th>
              </tr>
            </thead>
            <tbody>
              {(items ?? []).map((item) => (
                <tr key={item.id} className="border-t border-graphite-950/10">
                  <td>
                    {item.product_name}
                    {item.variant_label && (
                      <span className="block text-xs text-graphite-600">{item.variant_label}</span>
                    )}
                  </td>
                  <td className="font-mono text-xs">{item.sku}</td>
                  <td>{item.quantity}</td>
                  <td>{formatCents(item.unit_price_cents)}</td>
                  <td>{formatCents(item.line_total_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 ml-auto max-w-xs space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatCents(order.subtotal_cents)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>{formatCents(order.shipping_cents)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax</span>
            <span>{formatCents(order.tax_cents)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatCents(order.total_cents)}</span>
          </div>
        </div>

        {order.notes && (
          <p className="mt-4 rounded-md bg-amber-500/10 p-3 text-sm text-graphite-950">{order.notes}</p>
        )}
      </div>

      <div>
        <div className="rounded-lg border border-graphite-950/10 p-4">
          <h2 className="font-semibold">Customer</h2>
          <p className="mt-2 text-sm">{order.customer_name}</p>
          <p className="text-sm text-graphite-600">{order.customer_email}</p>
        </div>

        {shipping && (
          <div className="mt-4 rounded-lg border border-graphite-950/10 p-4">
            <h2 className="font-semibold">Shipping address</h2>
            <address className="mt-2 whitespace-pre-line text-sm not-italic text-graphite-600">
              {[shipping.line1, shipping.line2, `${shipping.city}, ${shipping.state} ${shipping.postal_code}`, shipping.country]
                .filter(Boolean)
                .join("\n")}
            </address>
          </div>
        )}

        <form action={updateFulfillment} className="mt-4 rounded-lg border border-graphite-950/10 p-4">
          <input type="hidden" name="orderId" value={order.id} />
          <h2 className="font-semibold">Fulfillment</h2>
          <label className="mt-3 flex flex-col gap-1 text-sm font-medium">
            Status
            <select name="fulfillment_status" defaultValue={order.fulfillment_status} className="admin-input">
              {STATUSES.map((s) => (
                <option key={s} value={s} className="capitalize">
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="mt-3 flex flex-col gap-1 text-sm font-medium">
            Tracking number
            <input name="tracking_number" defaultValue={order.tracking_number ?? ""} className="admin-input" />
          </label>
          <button type="submit" className="btn-primary mt-4 w-full">
            Save
          </button>
        </form>

        <p className="mt-4 text-xs text-graphite-600">
          Payment status: <span className="font-medium capitalize">{order.payment_status}</span>{" "}
          (managed by Stripe — refunds are issued from your Stripe Dashboard)
        </p>
      </div>
    </div>
  );
}
