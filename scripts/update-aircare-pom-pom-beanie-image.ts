import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.log("Skipping AIRCARE pom-pom beanie image update: Supabase build credentials are unavailable.");
  process.exit(0);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

const SLUG = "aircare-pom-pom-cuffed-beanie";
const NAME = "AIRCARE Pom-Pom Cuffed Beanie";
const IMAGE_URL = "/products-hires/aircare-pom-pom-cuffed-beanie.png?v=20260917";

async function main() {
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id")
    .eq("slug", SLUG)
    .single();

  if (productError || !product) throw productError ?? new Error(`${SLUG} was not found.`);

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
      .update({ alt_text: NAME, display_order: 0, is_primary: true })
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

  console.log(`Set the approved AIRCARE pom-pom beanie render for ${SLUG}.`);
}

main().catch((error) => {
  console.error("AIRCARE pom-pom beanie image update failed:", error);
  process.exit(1);
});
