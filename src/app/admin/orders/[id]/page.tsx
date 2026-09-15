import { notFound } from "next/navigation";
import { getAdminContext } from "@/lib/admin-context";
import { formatCents } from "@/lib/format";
import { updateFulfillment, updateSupplierFulfillment } from "@/app/admin/orders/actions";
import type { ProductVendorLink, SupplierAwareOrderItem } from "@/lib/types";

interface Props {
  params: Promise<{ id: string }>;
}

const STATUSES = ["unfulfilled", "processing", "shipped", "completed", "cancelled"];
const SUPPLIER_STATUSES = [
  ["ready_to_order", "Ready to order"],
  ["ordered", "Ordered"],
  ["in_production", "In production"],
  ["shipped", "Shipped"],
  ["cancelled", "Cancelled"],
] as const;

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const { db } = await getAdminContext();
  const typedDb = db as any;

  const [{ data: order }, { data: rawItems }] = await Promise.all([
    db.from("orders").select("*").eq("id", id).maybeSingle(),
    typedDb.from("order_items").select("*").eq("order_id", id),
  ]);

  if (!order) notFound();

  const items = (rawItems ?? []) as SupplierAwareOrderItem[];
  const productIds = [...new Set(items.map((item) => item.product_id).filter((v): v is string => !!v))];
  const { data: rawVendors } = productIds.length
    ? await db.from("product_vendor_links").select("*").in("product_id", productIds)
    : { data: [] as ProductVendorLink[] };
  const vendors = (rawVendors ?? []) as ProductVendorLink[];
  const vendorByProduct = new Map(vendors.map((vendor) => [vendor.product_id, vendor]));
  const supplierItems = items.filter((item) => item.supplier_fulfillment_status !== "not_required");
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
              {items.map((item) => (
                <tr key={item.id} className="border-t border-graphite-950/10">
                  <td>
                    {item.product_name}
                    {item.variant_label && (
                      <span className="block text-xs text-graphite-600">{item.variant_label}</span>
                    )}
                    {item.supplier_fulfillment_status !== "not_required" && (
                      <span className="mt-1 inline-block rounded bg-careblue-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-careblue-700">
                        {item.supplier_fulfillment_status.replaceAll("_", " ")}
                      </span>
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
          <div className="flex justify-between"><span>Subtotal</span><span>{formatCents(order.subtotal_cents)}</span></div>
          <div className="flex justify-between"><span>Shipping</span><span>{formatCents(order.shipping_cents)}</span></div>
          <div className="flex justify-between"><span>Tax</span><span>{formatCents(order.tax_cents)}</span></div>
          <div className="flex justify-between font-semibold"><span>Total</span><span>{formatCents(order.total_cents)}</span></div>
        </div>

        {supplierItems.length > 0 && (
          <section className="mt-8 border-t border-graphite-950/10 pt-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-semibold">Queensboro fulfillment</h2>
                <p className="mt-1 text-sm text-graphite-600">
                  Place the supplier order, record the Queensboro order number, and update production/tracking here.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              {supplierItems.map((item) => {
                const vendor = item.product_id ? vendorByProduct.get(item.product_id) : undefined;
                return (
                  <form
                    key={item.id}
                    action={updateSupplierFulfillment}
                    className="rounded-lg border border-graphite-950/10 bg-white p-4"
                  >
                    <input type="hidden" name="order_id" value={order.id} />
                    <input type="hidden" name="item_id" value={item.id} />
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold">{item.product_name}</p>
                        <p className="text-xs text-graphite-600">
                          {[item.variant_label, `Qty ${item.quantity}`, vendor?.vendor_sku ? `Queensboro ${vendor.vendor_sku}` : null]
                            .filter(Boolean)
                            .join(" • ")}
                        </p>
                      </div>
                      {vendor?.vendor_product_url && (
                        <a
                          href={vendor.vendor_product_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-careblue-700 underline"
                        >
                          Open Queensboro product ↗
                        </a>
                      )}
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <label className="flex flex-col gap-1 text-xs font-medium">
                        Supplier status
                        <select
                          name="supplier_fulfillment_status"
                          defaultValue={item.supplier_fulfillment_status}
                          className="admin-input"
                        >
                          {SUPPLIER_STATUSES.map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-medium">
                        Queensboro order #
                        <input
                          name="supplier_order_number"
                          defaultValue={item.supplier_order_number ?? ""}
                          className="admin-input"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-medium">
                        Supplier tracking #
                        <input
                          name="supplier_tracking_number"
                          defaultValue={item.supplier_tracking_number ?? ""}
                          className="admin-input"
                        />
                      </label>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-xs text-graphite-600">
                        {item.supplier_ordered_at
                          ? `Supplier order started ${new Date(item.supplier_ordered_at).toLocaleString()}`
                          : "Not yet ordered from supplier."}
                      </p>
                      <button type="submit" className="btn-secondary">Save supplier status</button>
                    </div>
                  </form>
                );
              })}
            </div>
          </section>
        )}

        {order.notes && (
          <p className="mt-4 rounded-md bg-violet-500/10 p-3 text-sm text-graphite-950">{order.notes}</p>
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
          <h2 className="font-semibold">Customer fulfillment</h2>
          <label className="mt-3 flex flex-col gap-1 text-sm font-medium">
            Status
            <select name="fulfillment_status" defaultValue={order.fulfillment_status} className="admin-input">
              {STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
            </select>
          </label>
          <label className="mt-3 flex flex-col gap-1 text-sm font-medium">
            Tracking number
            <input name="tracking_number" defaultValue={order.tracking_number ?? ""} className="admin-input" />
          </label>
          <button type="submit" className="btn-primary mt-4 w-full">Save</button>
        </form>

        <p className="mt-4 text-xs text-graphite-600">
          Payment status: <span className="font-medium capitalize">{order.payment_status}</span>{" "}
          (managed by Stripe — refunds are issued from your Stripe Dashboard)
        </p>
      </div>
    </div>
  );
}
