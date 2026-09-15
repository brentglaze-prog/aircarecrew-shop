import type { Database } from "@/lib/database.types";

export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type ProductImage = Database["public"]["Tables"]["product_images"]["Row"];
export type ProductVariant = Database["public"]["Tables"]["product_variants"]["Row"];
export type ProductVendorLink = Database["public"]["Tables"]["product_vendor_links"]["Row"];
export type StoreSettings = Database["public"]["Tables"]["store_settings"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];

export type ProductWithRelations = Product & {
  category: Pick<Category, "id" | "name" | "slug"> | null;
  images: ProductImage[];
  variants: ProductVariant[];
};

export type ProductCardData = Product & {
  images: Pick<ProductImage, "url" | "alt_text" | "is_primary">[];
  variants: Pick<ProductVariant, "inventory_quantity" | "is_active">[];
};

/** Derived, not stored: true when every active variant is out of stock. */
export function isSoldOut(variants: Pick<ProductVariant, "inventory_quantity" | "is_active">[]) {
  const active = variants.filter((v) => v.is_active);
  if (active.length === 0) return false;
  return active.every((v) => v.inventory_quantity <= 0);
}

export interface CartLineItem {
  variantId: string;
  productId: string;
  productSlug: string;
  productName: string;
  variantLabel: string | null;
  sku: string;
  unitPriceCents: number;
  quantity: number;
  imageUrl: string | null;
  maxQuantity: number;
}
