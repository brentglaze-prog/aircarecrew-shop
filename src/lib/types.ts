import type { Database } from "@/lib/database.types";

export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type ProductImage = Database["public"]["Tables"]["product_images"]["Row"];
export type ProductVariant = Database["public"]["Tables"]["product_variants"]["Row"];
export type ProductVendorLink = Database["public"]["Tables"]["product_vendor_links"]["Row"];
export type StoreSettings = Database["public"]["Tables"]["store_settings"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];

export type InventoryMode = "owned" | "supplier";
export type SupplierStatus = "not_applicable" | "unverified" | "available" | "low_stock" | "sold_out";
export type SupplierFulfillmentStatus =
  | "not_required"
  | "ready_to_order"
  | "ordered"
  | "in_production"
  | "shipped"
  | "cancelled";

// database.types.ts is regenerated from Supabase periodically. These intersections
// keep supplier-aware fields explicit in application code even between regenerations.
export type SupplierAwareVariant = ProductVariant & {
  inventory_mode: InventoryMode;
  supplier_status: SupplierStatus;
  supplier_checked_at: string | null;
  supplier_verified_until: string | null;
  max_order_quantity: number;
};

export type SupplierAwareOrderItem = OrderItem & {
  supplier_fulfillment_status: SupplierFulfillmentStatus;
  supplier_order_number: string | null;
  supplier_ordered_at: string | null;
  supplier_tracking_number: string | null;
};

export type ProductWithRelations = Product & {
  category: Pick<Category, "id" | "name" | "slug"> | null;
  images: ProductImage[];
  variants: SupplierAwareVariant[];
};

export type ProductCardData = Product & {
  images: Pick<ProductImage, "url" | "alt_text" | "is_primary">[];
  variants: Pick<
    SupplierAwareVariant,
    | "inventory_quantity"
    | "is_active"
    | "inventory_mode"
    | "supplier_status"
    | "supplier_verified_until"
    | "max_order_quantity"
  >[];
};

export function supplierVerificationIsCurrent(
  variant: Pick<SupplierAwareVariant, "supplier_verified_until">
) {
  if (!variant.supplier_verified_until) return false;
  const expires = new Date(variant.supplier_verified_until).getTime();
  return Number.isFinite(expires) && expires > Date.now();
}

export function isVariantSellable(
  variant: Pick<
    SupplierAwareVariant,
    "is_active" | "inventory_quantity" | "inventory_mode" | "supplier_status" | "supplier_verified_until"
  >
) {
  if (!variant.is_active) return false;
  if (variant.inventory_mode === "supplier") {
    return (
      (variant.supplier_status === "available" || variant.supplier_status === "low_stock") &&
      supplierVerificationIsCurrent(variant)
    );
  }
  return variant.inventory_quantity > 0;
}

export function maxSellableQuantity(
  variant: Pick<SupplierAwareVariant, "inventory_mode" | "inventory_quantity" | "max_order_quantity">
) {
  return variant.inventory_mode === "supplier"
    ? Math.max(1, Math.min(variant.max_order_quantity, 10))
    : Math.max(0, Math.min(variant.inventory_quantity, 10));
}

export function productAvailability(
  variants: ProductCardData["variants"]
): "available" | "verification_required" | "sold_out" {
  const active = variants.filter((v) => v.is_active);
  if (active.length === 0) return "sold_out";
  if (active.some((v) => isVariantSellable(v as SupplierAwareVariant))) return "available";

  const needsVerification = active.some(
    (v) =>
      v.inventory_mode === "supplier" &&
      (v.supplier_status === "unverified" ||
        ((v.supplier_status === "available" || v.supplier_status === "low_stock") &&
          !supplierVerificationIsCurrent(v as SupplierAwareVariant)))
  );
  return needsVerification ? "verification_required" : "sold_out";
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
