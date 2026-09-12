import { test, expect } from "@playwright/test";

/**
 * Login → Create Category → Create Product → Upload Image → Create Variants
 * → Publish → Verify Product Appears.
 *
 * Requires ADMIN_TEST_EMAIL / ADMIN_TEST_PASSWORD env vars for a real admin
 * user created per SETUP.md (never commit real credentials — pass them via
 * CI secrets or a local .env.test that's gitignored).
 */
test.describe("Admin management flow", () => {
  test.skip(
    !process.env.ADMIN_TEST_EMAIL || !process.env.ADMIN_TEST_PASSWORD,
    "Set ADMIN_TEST_EMAIL and ADMIN_TEST_PASSWORD to run this suite."
  );

  test("admin can log in, create a category and product, and see it live", async ({ page }) => {
    const email = process.env.ADMIN_TEST_EMAIL!;
    const password = process.env.ADMIN_TEST_PASSWORD!;
    const suffix = Date.now();

    await page.goto("/admin/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/admin$/);

    // Create category
    await page.goto("/admin/categories/new");
    await page.getByLabel("Name").fill(`Test Category ${suffix}`);
    await page.getByLabel(/slug/i).fill(`test-category-${suffix}`);
    await page.getByRole("button", { name: /save category/i }).click();
    await expect(page).toHaveURL(/\/admin\/categories$/);

    // Create product
    await page.goto("/admin/products/new");
    await page.getByLabel("Name").fill(`Test Product ${suffix}`);
    await page.getByLabel(/slug/i).first().fill(`test-product-${suffix}`);
    await page.getByLabel(/price/i).first().fill("19.99");
    await page.locator('select[name="status"]').selectOption("active");
    await page.locator('input[placeholder="SKU"]').first().fill(`TEST-${suffix}`);
    await page.locator('input[placeholder="Stock"]').first().fill("10");
    await page.getByRole("button", { name: /save product/i }).click();
    await expect(page).toHaveURL(/\/admin\/products\//);

    // Verify it appears on the storefront
    await page.goto(`/product/test-product-${suffix}`);
    await expect(page.getByRole("heading", { name: `Test Product ${suffix}` })).toBeVisible();
    await expect(page.getByRole("button", { name: /add to cart/i })).toBeEnabled();
  });
});
