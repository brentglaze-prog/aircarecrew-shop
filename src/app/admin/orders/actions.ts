"use server";

import { revalidatePath } from "next/cache";
import { getAdminContext } from "@/lib/admin-context";
import { fulfillmentUpdateSchema } from "@/lib/validations";

const SUPPLIER_STATUSES = new Set([
  "ready_to_order",
  "ordered",
  "in_production",
  "shipped",
  "cancelled",
]);

export async function updateFulfillment(formData: FormData) {
  const { db } = await getAdminContext();

  const parsed = fulfillmentUpdateSchema.safeParse({
    orderId: String(formData.get("orderId") || ""),
    fulfillment_status: String(formData.get("fulfillment_status") || ""),
    tracking_number: String(formData.get("tracking_number") || "") || null,
  });
  if (!parsed.success) throw new Error("Invalid fulfillment update.");

  const { error } = await db
    .from("orders")
    .update({
      fulfillment_status: parsed.data.fulfillment_status,
      tracking_number: parsed.data.tracking_number,
    })
    .eq("id", parsed.data.orderId);

  if (error) throw new Error("Could not update order.");
  revalidatePath(`/admin/orders/${parsed.data.orderId}`);
  revalidatePath("/admin/orders");
}

export async function updateSupplierFulfillment(formData: FormData) {
  const orderId = String(formData.get("order_id") || "");
  const itemId = String(formData.get("item_id") || "");
  const status = String(formData.get("supplier_fulfillment_status") || "");
  const supplierOrderNumber = String(formData.get("supplier_order_number") || "").trim() || null;
  const supplierTrackingNumber = String(formData.get("supplier_tracking_number") || "").trim() || null;

  if (!orderId || !itemId || !SUPPLIER_STATUSES.has(status)) {
    throw new Error("Invalid supplier fulfillment update.");
  }

  const { db } = await getAdminContext();
  const typedDb = db as any;
  const { data: existing } = await typedDb
    .from("order_items")
    .select("id, order_id, supplier_ordered_at")
    .eq("id", itemId)
    .eq("order_id", orderId)
    .maybeSingle();
  if (!existing) throw new Error("Order item not found.");

  const shouldHaveOrderedAt = ["ordered", "in_production", "shipped"].includes(status);
  const supplierOrderedAt = shouldHaveOrderedAt
    ? existing.supplier_ordered_at ?? new Date().toISOString()
    : existing.supplier_ordered_at;

  const { error } = await typedDb
    .from("order_items")
    .update({
      supplier_fulfillment_status: status,
      supplier_order_number: supplierOrderNumber,
      supplier_ordered_at: supplierOrderedAt,
      supplier_tracking_number: supplierTrackingNumber,
    })
    .eq("id", itemId)
    .eq("order_id", orderId);

  if (error) throw new Error("Could not update supplier fulfillment.");

  if (status === "shipped" && supplierTrackingNumber) {
    const { data: pendingItems } = await typedDb
      .from("order_items")
      .select("id")
      .eq("order_id", orderId)
      .in("supplier_fulfillment_status", ["ready_to_order", "ordered", "in_production"]);

    if ((pendingItems ?? []).length === 0) {
      await db
        .from("orders")
        .update({ fulfillment_status: "shipped", tracking_number: supplierTrackingNumber })
        .eq("id", orderId);
    } else {
      await db.from("orders").update({ fulfillment_status: "processing" }).eq("id", orderId);
    }
  } else if (["ordered", "in_production"].includes(status)) {
    await db.from("orders").update({ fulfillment_status: "processing" }).eq("id", orderId);
  }

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
}
