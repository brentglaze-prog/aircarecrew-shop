# AirCareCrew.shop

A small, production-oriented ecommerce store for air medical / HEMS crew merchandise — shirts and hats to start, built so new categories and products never require touching code.

**Stack:** Next.js 15 (App Router, TypeScript) · Tailwind CSS · Supabase (Postgres, Auth, Storage) · Stripe Checkout · Vercel.

## Status of this codebase (read this first)

This project was written by hand in a sandboxed environment with no access to the npm registry, Vercel, Supabase, or Stripe — so **it has not been installed, built, linted, type-checked, or run.** Treat it as a complete, carefully-written first draft, not a verified build. Package versions in `package.json` are ASSUMED-current as of early 2026 and should be checked with `npm outdated` right after `npm install`.

Before anything else, follow **[SETUP.md](./SETUP.md)** to install dependencies, create your Supabase and Stripe accounts, and run the app locally — that process will surface any real compile errors, which is expected for unverified hand-written code and normally quick to fix.

## Docs

- **[SETUP.md](./SETUP.md)** — local development setup, Supabase project, Stripe account, environment variables, creating your first admin login.
- **[ADMIN_GUIDE.md](./ADMIN_GUIDE.md)** — day-to-day store management (products, categories, orders) for a non-developer.
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** — deploying to Vercel and pointing the aircarecrew.shop domain (registered at GoDaddy) at it.

## Project structure

```
src/app/                 Next.js App Router pages + API routes
  (storefront pages)     /, /shop, /shop/[category], /product/[slug], /checkout/success,
                         /about, /contact, /shipping-returns, /privacy, /terms
  api/checkout/          Creates a Stripe Checkout Session (server-validated pricing/inventory)
  api/webhooks/stripe/   Verifies Stripe webhook signature, records paid orders, decrements stock
  admin/                 Supabase-Auth-gated store management UI
src/components/          Shared React components (storefront + admin/*)
src/lib/                 Supabase clients, Stripe client, types, Zod validation, cart context
supabase/migrations/     SQL schema, RLS policies, and the order-recording DB function
scripts/seed.ts          Seeds placeholder demo products (npm run seed)
e2e/                     Playwright end-to-end tests
```

## Key design decisions (made without stopping to ask, per project brief)

- **Data model:** every product has ≥1 row in `product_variants` (size/color both `NULL` for a "no variants" product), so inventory always lives at the variant level with one consistent code path. See the comment block at the top of `supabase/migrations/0001_init.sql` for the full reasoning.
- **Security model:** the browser only ever holds the Supabase anon key, which Row Level Security restricts to public/active data. All admin writes and the Stripe webhook use the service-role key, and only from server-only code (`src/lib/supabase/admin.ts`, guarded by `"server-only"`).
- **Pricing integrity:** the browser can only ever send `{ variantId, quantity }` to `/api/checkout` — price, product name, and stock are always re-read from the database server-side before a Stripe Checkout Session is created.
- **Inventory integrity:** stock is decremented exactly once per paid order via a single idempotent Postgres function (`fn_record_stripe_order`), keyed on the Stripe event id, so retried/duplicate webhook deliveries can't double-decrement.
- **Categories are safe to delete:** deleting a category never deletes or hides its products (`ON DELETE SET NULL`); the admin UI shows how many products will become uncategorized before you confirm.
- Tailwind is pinned to v3.4 rather than v4 for stability in unverified, hand-written code — noted so it's a deliberate choice, not an oversight.

## Local development

See SETUP.md for the full walkthrough. Once `.env.local` is filled in:

```bash
npm install
npm run seed      # optional: adds placeholder demo products
npm run dev
```

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run seed` | Insert placeholder demo categories/products |
| `npm run test:e2e` | Playwright end-to-end tests (see `e2e/`) |
