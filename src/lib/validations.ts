import { z } from "zod";

export const slugSchema = z
  .string()
  .min(1, "Slug is required")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only");

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  slug: slugSchema,
  description: z.string().max(2000).optional().nullable(),
  image_url: z.string().url().optional().nullable().or(z.literal("")),
  is_visible: z.boolean().default(true),
  display_order: z.coerce.number().int().default(0),
});

export const variantInputSchema = z.object({
  id: z.string().uuid().optional(),
  sku: z.string().min(1, "SKU is required").max(64),
  size: z.string().max(20).optional().nullable(),
  color: z.string().max(40).optional().nullable(),
  inventory_quantity: z.coerce.number().int().min(0),
  is_active: z.boolean().default(true),
  display_order: z.coerce.number().int().default(0),
});

export const productSchema = z.object({
  name: z.string().min(1, "Name is required").max(160),
  slug: slugSchema,
  category_id: z.string().uuid().nullable(),
  description: z.string().max(10000).optional().nullable(),
  short_description: z.string().max(300).optional().nullable(),
  price_cents: z.coerce.number().int().min(0, "Price cannot be negative"),
  compare_at_price_cents: z.coerce.number().int().min(0).optional().nullable(),
  status: z.enum(["draft", "active", "archived"]),
  is_featured: z.boolean().default(false),
  display_order: z.coerce.number().int().default(0),
  seo_title: z.string().max(160).optional().nullable(),
  seo_description: z.string().max(300).optional().nullable(),
  variants: z.array(variantInputSchema).min(1, "At least one variant (use no size/color for a simple product)"),
});

export const storeSettingsSchema = z.object({
  store_name: z.string().min(1).max(120),
  store_email: z.string().email(),
  announcement_bar_enabled: z.boolean(),
  announcement_bar_text: z.string().max(200).optional().nullable(),
  default_shipping_cents: z.coerce.number().int().min(0),
  free_shipping_threshold_cents: z.coerce.number().int().min(0).optional().nullable(),
  maintenance_mode: z.boolean(),
  return_policy_summary: z.string().max(2000),
  footer_text: z.string().max(500),
});

/** What the browser is allowed to tell /api/checkout — never price or product name. */
export const checkoutRequestSchema = z.object({
  items: z
    .array(
      z.object({
        variantId: z.string().uuid(),
        quantity: z.number().int().min(1).max(20),
      })
    )
    .min(1, "Cart is empty")
    .max(50),
});
export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;

export const fulfillmentUpdateSchema = z.object({
  orderId: z.string().uuid(),
  fulfillment_status: z.enum(["unfulfilled", "processing", "shipped", "completed", "cancelled"]),
  tracking_number: z.string().max(100).optional().nullable(),
});
