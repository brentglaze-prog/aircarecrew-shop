"use server";

import { revalidatePath } from "next/cache";
import { getAdminContext } from "@/lib/admin-context";

export interface VendorSourceFormState {
  error?: string;
  success?: boolean;
}

function nullable(formData: FormData, name: string) {
  return String(formData.get(name) || "").trim() || null;
}

export async function saveVendorSource(
  productId: string,
  _prev: VendorSourceFormState,
  formData: FormData
): Promise<VendorSourceFormState> {
  const { db } = await getAdminContext();
  const vendorName = nullable(formData, "vendor_name");
  const vendorProductUrl = nullable(formData, "vendor_product_url");
  const vendorSku = nullable(formData, "vendor_sku");
  const notes = nullable(formData, "notes");

  if (vendorProductUrl) {
    try {
      const url = new URL(vendorProductUrl);
      if (url.protocol !== "https:" && url.protocol !== "http:") {
        return { error: "Vendor URL must start with http:// or https://." };
      }
    } catch {
      return { error: "Enter a complete vendor product URL." };
    }
  }

  if (!vendorName && !vendorProductUrl && !vendorSku && !notes) {
    const { error } = await db.from("product_vendor_links").delete().eq("product_id", productId);
    if (error) return { error: "Could not clear vendor source information." };
    revalidatePath(`/admin/products/${productId}`);
    return { success: true };
  }

  const { error } = await db.from("product_vendor_links").upsert(
    {
      product_id: productId,
      vendor_name: vendorName,
      vendor_product_url: vendorProductUrl,
      vendor_sku: vendorSku,
      notes,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "product_id" }
  );

  if (error) return { error: "Could not save vendor source information." };

  revalidatePath(`/admin/products/${productId}`);
  return { success: true };
}
