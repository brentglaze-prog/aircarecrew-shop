"use server";

import { revalidatePath } from "next/cache";
import { getAdminContext } from "@/lib/admin-context";
import { storeSettingsSchema } from "@/lib/validations";

export interface FormState {
  error?: string;
  success?: boolean;
}

export async function updateSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  const { db } = await getAdminContext();

  const freeShipping = String(formData.get("free_shipping_threshold_cents") || "");

  const parsed = storeSettingsSchema.safeParse({
    store_name: String(formData.get("store_name") || ""),
    store_email: String(formData.get("store_email") || ""),
    announcement_bar_enabled: formData.get("announcement_bar_enabled") === "on",
    announcement_bar_text: String(formData.get("announcement_bar_text") || "") || null,
    default_shipping_cents: Number(formData.get("default_shipping_cents") || 0),
    free_shipping_threshold_cents: freeShipping ? Number(freeShipping) : null,
    maintenance_mode: formData.get("maintenance_mode") === "on",
    return_policy_summary: String(formData.get("return_policy_summary") || ""),
    footer_text: String(formData.get("footer_text") || ""),
  });

  if (!parsed.success) {
    return { error: "Please fix the errors below." };
  }

  const { error } = await db.from("store_settings").update(parsed.data).eq("id", true);
  if (error) return { error: "Could not save settings." };

  revalidatePath("/", "layout");
  return { success: true };
}
