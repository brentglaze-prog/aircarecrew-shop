"use server";

import { revalidatePath } from "next/cache";
import { getAdminContext } from "@/lib/admin-context";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const MAX_BYTES = 8 * 1024 * 1024;

export async function uploadProductImage(productId: string, formData: FormData) {
  const { db } = await getAdminContext();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("No file provided.");
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Only JPEG, PNG, WebP, or AVIF images are allowed.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Image is larger than the 8 MB limit.");
  }

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadError } = await db.storage.from("product-images").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

  const {
    data: { publicUrl },
  } = db.storage.from("product-images").getPublicUrl(path);

  const { count } = await db
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);
  const isFirst = !count || count === 0;

  const { error: insertError } = await db.from("product_images").insert({
    product_id: productId,
    url: publicUrl,
    alt_text: null,
    display_order: count ?? 0,
    is_primary: isFirst,
  });
  if (insertError) throw new Error("Could not save image record.");

  revalidatePath(`/admin/products/${productId}`);
}

export async function deleteProductImage(imageId: string, productId: string) {
  const { db } = await getAdminContext();
  await db.from("product_images").delete().eq("id", imageId);
  revalidatePath(`/admin/products/${productId}`);
}

export async function setPrimaryImage(imageId: string, productId: string) {
  const { db } = await getAdminContext();
  await db.from("product_images").update({ is_primary: false }).eq("product_id", productId);
  await db.from("product_images").update({ is_primary: true }).eq("id", imageId);
  revalidatePath(`/admin/products/${productId}`);
}

export async function moveImage(imageId: string, productId: string, direction: "up" | "down") {
  const { db } = await getAdminContext();
  const { data: images } = await db
    .from("product_images")
    .select("id, display_order")
    .eq("product_id", productId)
    .order("display_order", { ascending: true });
  if (!images) return;

  const index = images.findIndex((i) => i.id === imageId);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= images.length) return;

  const a = images[index]!;
  const b = images[swapIndex]!;
  await db.from("product_images").update({ display_order: b.display_order }).eq("id", a.id);
  await db.from("product_images").update({ display_order: a.display_order }).eq("id", b.id);

  revalidatePath(`/admin/products/${productId}`);
}
