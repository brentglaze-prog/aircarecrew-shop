"use server";

import { revalidatePath } from "next/cache";
import { getAdminContext } from "@/lib/admin-context";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const MAX_BYTES = 8 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

type UploadTicket =
  | { ok: true; path: string; token: string }
  | { ok: false; error: string };

type UploadResult =
  | { ok: true }
  | { ok: false; error: string };

export async function createProductImageUploadUrl(
  productId: string,
  fileName: string,
  fileType: string,
  fileSize: number
): Promise<UploadTicket> {
  if (!fileName || !ALLOWED_TYPES.has(fileType)) {
    return { ok: false, error: "Only JPEG, PNG, WebP, or AVIF images are allowed." };
  }
  if (!Number.isFinite(fileSize) || fileSize <= 0) {
    return { ok: false, error: "The selected image is empty or invalid." };
  }
  if (fileSize > MAX_BYTES) {
    return { ok: false, error: "Image is larger than the 8 MB limit." };
  }

  try {
    const { db } = await getAdminContext();

    const { data: product } = await db
      .from("products")
      .select("id")
      .eq("id", productId)
      .maybeSingle();

    if (!product) {
      return { ok: false, error: "Product not found." };
    }

    const ext = EXTENSIONS[fileType];
    const path = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

    const { data, error } = await db.storage
      .from("product-images")
      .createSignedUploadUrl(path);

    if (error || !data?.token) {
      return {
        ok: false,
        error: error?.message ? `Could not prepare upload: ${error.message}` : "Could not prepare image upload.",
      };
    }

    return { ok: true, path, token: data.token };
  } catch {
    return { ok: false, error: "Could not prepare image upload. Please refresh and try again." };
  }
}

export async function finalizeProductImageUpload(
  productId: string,
  path: string
): Promise<UploadResult> {
  if (!path.startsWith(`${productId}/`)) {
    return { ok: false, error: "Invalid product image path." };
  }

  try {
    const { db } = await getAdminContext();

    const {
      data: { publicUrl },
    } = db.storage.from("product-images").getPublicUrl(path);

    const { count, error: countError } = await db
      .from("product_images")
      .select("id", { count: "exact", head: true })
      .eq("product_id", productId);

    if (countError) {
      await db.storage.from("product-images").remove([path]);
      return { ok: false, error: "Image uploaded, but the catalog could not be updated." };
    }

    const isFirst = !count || count === 0;
    const { error: insertError } = await db.from("product_images").insert({
      product_id: productId,
      url: publicUrl,
      alt_text: null,
      display_order: count ?? 0,
      is_primary: isFirst,
    });

    if (insertError) {
      await db.storage.from("product-images").remove([path]);
      return { ok: false, error: "Image uploaded, but the catalog could not be updated." };
    }

    revalidatePath(`/admin/products/${productId}`);
    revalidatePath(`/product`, "layout");
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not finish saving the product image." };
  }
}

export async function deleteProductImage(imageId: string, productId: string) {
  const { db } = await getAdminContext();

  const { data: image } = await db
    .from("product_images")
    .select("url")
    .eq("id", imageId)
    .eq("product_id", productId)
    .maybeSingle();

  await db.from("product_images").delete().eq("id", imageId).eq("product_id", productId);

  if (image?.url) {
    const marker = "/storage/v1/object/public/product-images/";
    const index = image.url.indexOf(marker);
    if (index !== -1) {
      const objectPath = decodeURIComponent(image.url.slice(index + marker.length));
      if (objectPath.startsWith(`${productId}/`)) {
        await db.storage.from("product-images").remove([objectPath]);
      }
    }
  }

  revalidatePath(`/admin/products/${productId}`);
  revalidatePath(`/product`, "layout");
}

export async function setPrimaryImage(imageId: string, productId: string) {
  const { db } = await getAdminContext();
  await db.from("product_images").update({ is_primary: false }).eq("product_id", productId);
  await db.from("product_images").update({ is_primary: true }).eq("id", imageId);
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath(`/product`, "layout");
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