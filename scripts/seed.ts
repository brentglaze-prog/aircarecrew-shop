/**
 * Seeds the database with clearly-labeled placeholder demo content so the
 * storefront and admin can be evaluated before real products are uploaded.
 *
 * Usage:
 *   npm run seed
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 * (this script uses the service role key and must never run in the browser).
 *
 * Safe to re-run: uses upsert on slug/sku so it won't create duplicates.
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add them to .env.local first."
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

// Neutral, tasteful placeholder imagery — clearly replaceable, no
// copyrighted logos or trade dress of any employer/operator.
function placeholderImage(label: string, bg: string) {
  const text = encodeURIComponent(label);
  return `https://placehold.co/1200x1500/${bg}/f6f4ef?text=${text}`;
}

async function upsertCategory(input: {
  name: string;
  slug: string;
  description: string;
  display_order: number;
}) {
  const { data, error } = await supabase
    .from("categories")
    .upsert(
      { ...input, is_visible: true },
      { onConflict: "slug" }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function upsertProduct(input: {
  category_id: string;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  price_cents: number;
  compare_at_price_cents?: number | null;
  is_featured?: boolean;
  display_order: number;
}) {
  const { data, error } = await supabase
    .from("products")
    .upsert(
      { ...input, status: "active" },
      { onConflict: "slug" }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function replaceImages(productId: string, images: { url: string; alt_text: string }[]) {
  await supabase.from("product_images").delete().eq("product_id", productId);
  const rows = images.map((img, i) => ({
    product_id: productId,
    url: img.url,
    alt_text: img.alt_text,
    display_order: i,
    is_primary: i === 0,
  }));
  const { error } = await supabase.from("product_images").insert(rows);
  if (error) throw error;
}

async function upsertVariants(
  productId: string,
  variants: { sku: string; size: string | null; color: string | null; inventory_quantity: number }[]
) {
  for (const [i, v] of variants.entries()) {
    const { error } = await supabase.from("product_variants").upsert(
      { product_id: productId, display_order: i, is_active: true, ...v },
      { onConflict: "sku" }
    );
    if (error) throw error;
  }
}

async function main() {
  console.log("Seeding categories...");
  const shirts = await upsertCategory({
    name: "Shirts",
    slug: "shirts",
    description: "Crew tees built for long shifts and short turnarounds.",
    display_order: 1,
  });
  const hats = await upsertCategory({
    name: "Hats",
    slug: "hats",
    description: "Structured and unstructured caps for on and off duty.",
    display_order: 2,
  });

  const sizes = ["S", "M", "L", "XL", "2XL", "3XL"];

  console.log("Seeding shirts...");
  const shirtDefs = [
    {
      name: "AirCrew Classic Tee",
      slug: "aircrew-classic-tee",
      short_description: "The everyday crew tee. Soft cotton blend, relaxed fit.",
      description:
        "[Placeholder product copy] A classic crew neck tee in a soft cotton blend, built for everyday wear on and off shift. Relaxed, breathable fit. Replace this description from Admin → Products.",
      price_cents: 2800,
      compare_at_price_cents: null,
      is_featured: true,
      colors: ["Black", "Navy", "Gray"],
    },
    {
      name: "Flight Crew Performance Tee",
      slug: "flight-crew-performance-tee",
      short_description: "Moisture-wicking performance fabric for long shifts.",
      description:
        "[Placeholder product copy] A lightweight, moisture-wicking performance tee designed for long shifts and temperature swings between the aircraft and the hospital. Replace this description from Admin → Products.",
      price_cents: 3200,
      compare_at_price_cents: 3600,
      is_featured: true,
      colors: ["Black", "Gray"],
    },
    {
      name: "Night Shift Tee",
      slug: "night-shift-tee",
      short_description: "Understated dark colorway for the night crew.",
      description:
        "[Placeholder product copy] A heavyweight tee in an understated dark colorway, made for the night shift crowd. Replace this description from Admin → Products.",
      price_cents: 3000,
      compare_at_price_cents: null,
      is_featured: false,
      colors: ["Black"],
    },
  ];

  for (const [i, def] of shirtDefs.entries()) {
    const product = await upsertProduct({
      category_id: shirts.id,
      name: def.name,
      slug: def.slug,
      description: def.description,
      short_description: def.short_description,
      price_cents: def.price_cents,
      compare_at_price_cents: def.compare_at_price_cents,
      is_featured: def.is_featured,
      display_order: i,
    });

    await replaceImages(product.id, [
      { url: placeholderImage(def.name, "1b1e26"), alt_text: `${def.name} — front, placeholder image` },
      { url: placeholderImage(`${def.name} (back)`, "0a1628"), alt_text: `${def.name} — back, placeholder image` },
    ]);

    const variants = def.colors.flatMap((color) =>
      sizes.map((size) => ({
        sku: `${def.slug.toUpperCase()}-${color.slice(0, 3).toUpperCase()}-${size}`,
        size,
        color,
        inventory_quantity: size === "3XL" ? 3 : 12,
      }))
    );
    await upsertVariants(product.id, variants);
  }

  console.log("Seeding hats...");
  const hatDefs = [
    {
      name: "Crew Trucker Hat",
      slug: "crew-trucker-hat",
      short_description: "Structured trucker with a breathable mesh back.",
      description:
        "[Placeholder product copy] A structured trucker cap with a breathable mesh back and adjustable snapback closure. Replace this description from Admin → Products.",
      price_cents: 2400,
      compare_at_price_cents: null,
      is_featured: true,
      colors: ["Black", "Gray"],
    },
    {
      name: "Flight Deck Cap",
      slug: "flight-deck-cap",
      short_description: "Low-profile unstructured cap, one size fits most.",
      description:
        "[Placeholder product copy] A low-profile, unstructured six-panel cap with a soft curved brim. One size fits most. Replace this description from Admin → Products.",
      price_cents: 2600,
      compare_at_price_cents: null,
      is_featured: false,
      colors: ["Navy"],
    },
    {
      name: "Blackout Crew Hat",
      slug: "blackout-crew-hat",
      short_description: "Tonal blackout colorway, subtle embroidered mark.",
      description:
        "[Placeholder product copy] An all-black tonal cap with a subtle embroidered mark. Replace this description from Admin → Products.",
      price_cents: 2600,
      compare_at_price_cents: null,
      is_featured: false,
      colors: [],
    },
  ];

  for (const [i, def] of hatDefs.entries()) {
    const product = await upsertProduct({
      category_id: hats.id,
      name: def.name,
      slug: def.slug,
      description: def.description,
      short_description: def.short_description,
      price_cents: def.price_cents,
      compare_at_price_cents: def.compare_at_price_cents,
      is_featured: def.is_featured,
      display_order: i,
    });

    await replaceImages(product.id, [
      { url: placeholderImage(def.name, "272b35"), alt_text: `${def.name}, placeholder image` },
    ]);

    const variants =
      def.colors.length > 0
        ? def.colors.map((color) => ({
            sku: `${def.slug.toUpperCase()}-${color.slice(0, 3).toUpperCase()}`,
            size: null,
            color,
            inventory_quantity: 20,
          }))
        : [{ sku: `${def.slug.toUpperCase()}-OS`, size: null, color: null, inventory_quantity: 20 }];
    await upsertVariants(product.id, variants);
  }

  console.log("Seed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
