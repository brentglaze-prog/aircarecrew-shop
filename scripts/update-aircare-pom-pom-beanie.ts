import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.log("Skipping AIRCARE pom-pom beanie catalog update: Supabase build credentials are unavailable.");
  process.exit(0);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

const OLD_SLUG = "atl-pom-pom-cuffed-beanie";
const NEW_SLUG = "aircare-pom-pom-cuffed-beanie";
const NAME = "AIRCARE Pom-Pom Cuffed Beanie";
const DESCRIPTION =
  "Charcoal pom-pom cuffed beanie with purple AIRCARE embroidered logo on the cuff.";
const IMAGE_URL = "/products-hires/aircare-pom-pom-cuffed-beanie-v2.svg?v=20260916d";

async function main() {
  const { data: products, error: productLookupError } = await supabase
    .from("products")
    .select("id, slug")
    .in("slug", [OLD_SLUG, NEW_SLUG]);

  if (productLookupError) throw productLookupError;
  if (!products || products.length === 0) {
    throw new Error(`Neither ${OLD_SLUG} nor ${NEW_SLUG} exists; refusing to create a duplicate product.`);
  }
  if (products.length > 1) {
    throw new Error(`Both ${OLD_SLUG} and ${NEW_SLUG} exist; manual duplicate resolution is required.`);
  }

  const product = products[0]!;
  const { data: hats, error: categoryError } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", "hats")
    .single();

  if (categoryError || !hats) throw categoryError ?? new Error("Hats category not found.");

  const { error: updateError } = await supabase
    .from("products")
    .update({
      category_id: hats.id,
      name: NAME,
      slug: NEW_SLUG,
      status: "active",
      description: DESCRIPTION,
      short_description: DESCRIPTION,
      seo_title: NAME,
      seo_description: DESCRIPTION,
    })
    .eq("id", product.id);

  if (updateError) throw updateError;

  const { error: removeOldImagesError } = await supabase
    .from("product_images")
    .delete()
    .eq("product_id", product.id)
    .neq("url", IMAGE_URL);

  if (removeOldImagesError) throw removeOldImagesError;

  const { data: approvedImage, error: imageLookupError } = await supabase
    .from("product_images")
    .select("id")
    .eq("product_id", product.id)
    .eq("url", IMAGE_URL)
    .maybeSingle();

  if (imageLookupError) throw imageLookupError;

  const { error: clearPrimaryError } = await supabase
    .from("product_images")
    .update({ is_primary: false })
    .eq("product_id", product.id);

  if (clearPrimaryError) throw clearPrimaryError;

  if (approvedImage) {
    const { error } = await supabase
      .from("product_images")
      .update({
        alt_text: NAME,
        display_order: 0,
        is_primary: true,
      })
      .eq("id", approvedImage.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("product_images").insert({
      product_id: product.id,
      url: IMAGE_URL,
      alt_text: NAME,
      display_order: 0,
      is_primary: true,
    });
    if (error) throw error;
  }

  console.log(`Converted ${product.slug} to ${NEW_SLUG} with the approved AIRCARE image.`);
}

main().catch((error) => {
  console.error("AIRCARE pom-pom beanie catalog update failed:", error);
  process.exit(1);
});
