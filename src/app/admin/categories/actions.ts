"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin-context";
import { categorySchema } from "@/lib/validations";

export interface FormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

function parseFormData(formData: FormData) {
  return {
    name: String(formData.get("name") || ""),
    slug: String(formData.get("slug") || ""),
    description: String(formData.get("description") || "") || null,
    image_url: String(formData.get("image_url") || "") || null,
    is_visible: formData.get("is_visible") === "on",
    display_order: Number(formData.get("display_order") || 0),
  };
}

export async function createCategory(_prev: FormState, formData: FormData): Promise<FormState> {
  const { db } = await getAdminContext();

  const parsed = categorySchema.safeParse(parseFormData(formData));
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: flatten(parsed.error) };
  }

  const { error } = await db.from("categories").insert(parsed.data);
  if (error) {
    if (error.code === "23505") return { error: "That slug is already in use." };
    return { error: "Could not create category." };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/shop");
  redirect("/admin/categories");
}

export async function updateCategory(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { db } = await getAdminContext();

  const parsed = categorySchema.safeParse(parseFormData(formData));
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: flatten(parsed.error) };
  }

  const { error } = await db.from("categories").update(parsed.data).eq("id", id);
  if (error) {
    if (error.code === "23505") return { error: "That slug is already in use." };
    return { error: "Could not update category." };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/shop");
  redirect("/admin/categories");
}

export async function deleteCategory(id: string) {
  const { db } = await getAdminContext();
  // products.category_id is ON DELETE SET NULL — deleting a category never
  // deletes or hides its products, it only uncategorizes them. The list
  // page shows the affected product count before this is called.
  const { error } = await db.from("categories").delete().eq("id", id);
  if (error) throw new Error("Could not delete category.");
  revalidatePath("/admin/categories");
  revalidatePath("/shop");
}

function flatten(error: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } }) {
  const out: Record<string, string> = {};
  const fe = error.flatten().fieldErrors;
  for (const key in fe) {
    const msgs = fe[key];
    if (msgs && msgs[0]) out[key] = msgs[0];
  }
  return out;
}
