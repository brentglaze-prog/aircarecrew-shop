"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin-context";
import { productSchema } from "@/lib/validations";
import type { Product, ProductImage, ProductVariant } from "@/lib/types";

export interface FormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

function parseFormData(formData: FormData) {
  const variantsJson = String(formData.get("variants_json") || "[]");
  let rawVariants: Array<Record<string, unknown>> = [];
  try {
    rawVariants = JSON.parse(variantsJson);
  } catch {
    rawVariants = [];
  }
  // Normalize "no size/color" from empty strings (what the form sends) to
  // NULL, matching the DB's actual "simple product" representation.
  const variants = rawVariants.map((v) => ({
    ...v,
    size: v.size === "" ? null : v.size,
    color: v.color === "" ? null : v.color,
  }));

  const categoryId = String(formData.get("category_id") || "");
  const compareAt = String(formData.get("compare_at_price_cents") || "");

  return {
    name: String(formData.get("name") || ""),
    slug: String(formData.get("slug") || ""),
    category_id: categoryId || null,
    description: String(formData.get("description") || "") || null,
    short_description: String(formData.get("short_description") || "") || null,
    price_cents: Number(formData.get("price_cents") || 0),
    compare_at_price_cents: compareAt ? Number(compareAt) : null,
    status: String(formData.get("status") || "draft"),
    is_featured: formData.get("is_featured") === "on",
    display_order: Number(formData.get("display_order") || 0),
    seo_title: String(formData.get("seo_title") || "") || null,
    seo_description: String(formData.get("seo_description") || "") || null,
    variants,
  };
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

export async function createProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  const { db } = await getAdminContext();

  const parsed = productSchema.safeParse(parseFormData(formData));
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: flatten(parsed.error) };
  }

  const { variants, ...product } = parsed.data;

  const { data: created, error } = await db.from("products").insert(product).select("id").single();
  if (error) {
    if (error.code === "23505") return { error: "That slug is already in use." };
    return { error: "Could not create product." };
  }

  const { error: variantError } = await db
    .from("product_variants")
    .insert(variants.map((v) => ({ ...v, product_id: created.id })));
  if (variantError) {
    return { error: `Product created, but variants failed to save: ${variantError.message}` };
  }

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  redirect(`/admin/products/${created.id}`);
}

export async function updateProduct(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { db } = await getAdminContext();

  const parsed = productSchema.safeParse(parseFormData(formData));
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: flatten(parsed.error) };
  }

  const { variants, ...product } = parsed.data;

  const { error } = await db.from("products").update(product).eq("id", id);
  if (error) {
    if (error.code === "23505") return { error: "That slug is already in use." };
    return { error: "Could not update product." };
  }

  const { data: existingVariants } = await db.from("product_variants").select("id").eq("product_id", id);
  const existingIds = new Set((existingVariants ?? []).map((v) => v.id));
  const submittedIds = new Set(variants.filter((v) => v.id).map((v) => v.id as string));

  const toDelete = [...existingIds].filter((vid) => !submittedIds.has(vid));
  const toUpdate = variants.filter((v) => v.id);
  const toInsert = variants.filter((v) => !v.id);

  if (toDelete.length > 0) {
    await db.from("product_variants").delete().in("id", toDelete);
  }
  for (const v of toUpdate) {
    await db
      .from("product_variants")
      .update({
        sku: v.sku,
        size: v.size,
        color: v.color,
        inventory_quantity: v.inventory_quantity,
        is_active: v.is_active,
        display_order: v.display_order,
      })
      .eq("id", v.id as string);
  }
  if (toInsert.length > 0) {
    await db.from("product_variants").insert(toInsert.map((v) => ({ ...v, product_id: id })));
  }

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath(`/product/${product.slug}`);
  redirect(`/admin/products/${id}`);
}

export async function duplicateProduct(id: string) {
  const { db } = await getAdminContext();

  const { data: rawOriginal } = await db
    .from("products")
    .select("*, variants:product_variants(*), images:product_images(*)")
    .eq("id", id)
    .single();
  if (!rawOriginal) throw new Error("Product not found.");

  const original = rawOriginal as unknown as Product & {
    variants: ProductVariant[];
    images: ProductImage[];
  };

  const newSlug = `${original.slug}-copy-${Math.random().toString(36).slice(2, 6)}`;

  const { data: created, error } = await db
    .from("products")
    .insert({
      name: `${original.name} (Copy)`,
      slug: newSlug,
      category_id: original.category_id,
      description: original.description,
      short_description: original.short_description,
      price_cents: original.price_cents,
      compare_at_price_cents: original.compare_at_price_cents,
      status: "draft",
      is_featured: false,
      display_order: original.display_order,
      seo_title: original.seo_title,
      seo_description: original.seo_description,
    })
    .select("id")
    .single();
  if (error || !created) throw new Error("Could not duplicate product.");

  const { variants, images } = original;

  if (variants?.length) {
    await db.from("product_variants").insert(
      variants.map((v: { sku: string; size: string | null; color: string | null; inventory_quantity: number; is_active: boolean; display_order: number }) => ({
        product_id: created.id,
        sku: `${v.sku}-COPY-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
        size: v.size,
        color: v.color,
        inventory_quantity: v.inventory_quantity,
        is_active: v.is_active,
        display_order: v.display_order,
      }))
    );
  }
  if (images?.length) {
    await db.from("product_images").insert(
      images.map((img: { url: string; alt_text: string | null; display_order: number; is_primary: boolean }) => ({
        product_id: created.id,
        url: img.url,
        alt_text: img.alt_text,
        display_order: img.display_order,
        is_primary: img.is_primary,
      }))
    );
  }

  revalidatePath("/admin/products");
}

export async function archiveProduct(id: string) {
  const { db } = await getAdminContext();
  const { error } = await db.from("products").update({ status: "archived" }).eq("id", id);
  if (error) throw new Error("Could not archive product.");
  revalidatePath("/admin/products");
  revalidatePath("/shop");
}

export async function setProductStatus(id: string, status: "draft" | "active" | "archived") {
  const { db } = await getAdminContext();
  const { error } = await db.from("products").update({ status }).eq("id", id);
  if (error) throw new Error("Could not update product status.");
  revalidatePath("/admin/products");
  revalidatePath("/shop");
}

export async function deleteProduct(id: string) {
  const { db } = await getAdminContext();

  const { count } = await db
    .from("order_items")
    .select("id", { count: "exact", head: true })
    .eq("product_id", id);

  if (count && count > 0) {
    throw new Error(
      "This product has order history and can't be permanently deleted — use Archive instead to hide it while keeping order records intact."
    );
  }

  const { error } = await db.from("products").delete().eq("id", id);
  if (error) throw new Error("Could not delete product.");
  revalidatePath("/admin/products");
  revalidatePath("/shop");
}
