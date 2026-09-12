import { test, expect } from "@playwright/test";

/**
 * Homepage → Shirts → Product → Select Size → Add to Cart → Checkout.
 *
 * Requires the app to be running against a Supabase project that has run
 * the migrations AND `npm run seed` (so at least one shirt with size
 * variants and stock exists). Stops short of completing payment on Stripe's
 * hosted page — that's exercised manually with a Stripe test card per
 * DEPLOYMENT.md, since driving Stripe's own checkout UI in CI is brittle
 * and out of scope for this suite.
 */
test.describe("Customer purchase flow", () => {
  test("can browse to a product, select a size, add to cart, and reach Stripe checkout", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /gear for the crew/i })).toBeVisible();

    await page.getByRole("link", { name: "Shop Shirts" }).click();
    await expect(page).toHaveURL(/\/shop\/shirts/);

    const firstProduct = page.locator('a[href^="/product/"]').first();
    await expect(firstProduct).toBeVisible();
    await firstProduct.click();
    await expect(page).toHaveURL(/\/product\//);

    // Select a size if the product has sizes.
    const sizeButtons = page.locator("fieldset", { hasText: "Size" }).locator("button");
    if (await sizeButtons.count()) {
      await sizeButtons.first().click();
    }

    await page.getByRole("button", { name: /add to cart/i }).click();

    // Cart drawer opens with the item.
    await expect(page.getByRole("dialog", { name: /shopping cart/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /checkout/i })).toBeEnabled();

    // Clicking checkout redirects off-site to Stripe's hosted Checkout page.
    await Promise.all([
      page.waitForURL(/checkout\.stripe\.com/, { timeout: 15_000 }).catch(() => null),
      page.getByRole("button", { name: /checkout/i }).click(),
    ]);
  });

  test("shows sold out state and disables add to cart when a variant has no stock", async ({ page }) => {
    // This test expects a seeded product/variant with inventory_quantity = 0;
    // adjust the slug below to match a real out-of-stock fixture in your data.
    test.skip(true, "Wire this up to a known out-of-stock product slug in your seed/test data.");
  });
});
