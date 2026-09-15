import { createClient } from "@/lib/supabase/server";
import type { Category, ProductCardData, ProductWithRelations, StoreSettings } from "@/lib/types";

const PRODUCT_CARD_SELECT = `
  *,
  images:product_images ( url, alt_text, is_primary, display_order ),
  variants:product_variants (
    inventory_quantity,
    is_active,
    inventory_mode,
    supplier_status,
    supplier_verified_until,
    max_order_quantity
  )
`;

export async function getVisibleCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_visible", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("getVisibleCategories failed", error);
    return [];
  }
  return data ?? [];
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("categories").select("*").eq("slug", slug).maybeSingle();
  if (error) {
    console.error("getCategoryBySlug failed", error);
    return null;
  }
  return data;
}

export async function getActiveProducts(options?: {
  categoryId?: string;
  featuredOnly?: boolean;
  limit?: number;
}): Promise<ProductCardData[]> {
  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select(PRODUCT_CARD_SELECT)
    .eq("status", "active")
    .order("display_order", { ascending: true });

  if (options?.categoryId) query = query.eq("category_id", options.categoryId);
  if (options?.featuredOnly) query = query.eq("is_featured", true);
  if (options?.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) {
    console.error("getActiveProducts failed", error);
    return [];
  }
  return (data ?? []) as unknown as ProductCardData[];
}

export async function getProductBySlug(slug: string): Promise<ProductWithRelations | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      `*,
      category:categories ( id, name, slug ),
      images:product_images ( * ),
      variants:product_variants ( * )`
    )
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    console.error("getProductBySlug failed", error);
    return null;
  }
  if (!data) return null;

  const product = data as unknown as ProductWithRelations;
  product.images = [...product.images].sort((a, b) => a.display_order - b.display_order);
  product.variants = [...product.variants]
    .filter((v) => v.is_active)
    .sort((a, b) => a.display_order - b.display_order);
  return product;
}

export async function getStoreSettings(): Promise<StoreSettings | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("store_settings").select("*").eq("id", true).maybeSingle();
  if (error) {
    console.error("getStoreSettings failed", error);
    return null;
  }
  return data;
}
