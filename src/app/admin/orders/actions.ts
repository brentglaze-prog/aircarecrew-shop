"use server";

import { revalidatePath } from "next/cache";
import { getAdminContext } from "@/lib/admin-context";
import { fulfillmentUpdateSchema } from "@/lib/validations";

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
