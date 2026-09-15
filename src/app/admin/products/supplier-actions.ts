"use server";

import { revalidatePath } from "next/cache";
import { getAdminContext } from "@/lib/admin-context";

const ALLOWED_STATUSES = new Set(["unverified", "available", "low_stock", "sold_out"]);

function clampHours(raw: FormDataEntryValue | null) {
  const n = Number(raw ?? 72);
  if (!Number.isFinite(n)) return 72;
  return Math.max(1, Math.min(Math.round(n), 168));
}

function clampMaxQty(raw: FormDataEntryValue | null) {
  const n = Number(raw ?? 5);
  if (!Number.isFinite(n)) return 5;
  return Math.max(1, Math.min(Math.round(n), 25));
}

function verificationFields(status: string, hours: number) {
  const now = new Date();
  if (status === "available" || status === "low_stock") {
    return {
      supplier_checked_at: now.toISOString(),
      supplier_verified_until: new Date(now.getTime() + hours * 60 * 60 * 1000).toISOString(),
    };
  }
  if (status === "sold_out") {
    return { supplier_checked_at: now.toISOString(), supplier_verified_until: null };
  }
  return { supplier_checked_at: null, supplier_verified_until: null };
}

export async function setSupplierVariantAvailability(formData: FormData) {
  const productId = String(formData.get("product_id") || "");
  const variantId = String(formData.get("variant_id") || "");
  const status = String(formData.get("supplier_status") || "unverified");
  const hours = clampHours(formData.get("verify_hours"));
  const maxOrderQuantity = clampMaxQty(formData.get("max_order_quantity"));

  if (!productId || !variantId || !ALLOWED_STATUSES.has(status)) {
    throw new Error("Invalid supplier availability update.");
  }

  const { db } = await getAdminContext();
  const typedDb = db as any;
  const { data: variant } = await typedDb
    .from("product_variants")
    .select("id, product_id")
    .eq("id", variantId)
    .eq("product_id", productId)
    .maybeSingle();
  if (!variant) throw new Error("Variant not found.");

  const { error } = await typedDb
    .from("product_variants")
    .update({
      inventory_mode: "supplier",
      inventory_quantity: 0,
      supplier_status: status,
      max_order_quantity: maxOrderQuantity,
      ...verificationFields(status, hours),
    })
    .eq("id", variantId)
    .eq("product_id", productId);

  if (error) throw new Error("Could not update supplier availability.");
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/shop");
}

export async function bulkSetSupplierAvailability(formData: FormData) {
  const productId = String(formData.get("product_id") || "");
  const status = String(formData.get("supplier_status") || "unverified");
  const hours = clampHours(formData.get("verify_hours"));
  const maxOrderQuantity = clampMaxQty(formData.get("max_order_quantity"));

  if (!productId || !ALLOWED_STATUSES.has(status)) {
    throw new Error("Invalid bulk supplier availability update.");
  }

  const { db } = await getAdminContext();
  const typedDb = db as any;
  const { error } = await typedDb
    .from("product_variants")
    .update({
      inventory_mode: "supplier",
      inventory_quantity: 0,
      supplier_status: status,
      max_order_quantity: maxOrderQuantity,
      ...verificationFields(status, hours),
    })
    .eq("product_id", productId)
    .eq("is_active", true);

  if (error) throw new Error("Could not update supplier availability.");
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/shop");
}
