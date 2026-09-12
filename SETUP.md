# Setup

Follow this in order. Each section says exactly what to click/run.

## 0. Prerequisites

- Node.js 20+ (Node 22 recommended) and npm
- A GitHub account (recommended, for Vercel's git integration)
- A Supabase account — [supabase.com](https://supabase.com) (free tier is enough to start)
- A Stripe account — [stripe.com](https://stripe.com) (free; fees apply per transaction)
- A Vercel account — [vercel.com](https://vercel.com) (free tier is enough to start)

## 1. Install dependencies

```bash
cd aircarecrew-shop
npm install
```

This codebase was written without network access to npm, so **this is the first time it will actually be checked.** If `npm install` or the next steps surface type errors, they're expected first-run issues in hand-written code — fix them as they come up; nothing here depends on an external service to resolve.

```bash
npm run typecheck
npm run lint
```

## 2. Create the Supabase project

1. In the Supabase dashboard, create a new project. Pick a strong database password and save it somewhere safe (a password manager, not this repo).
2. Once it's provisioned, go to **Project Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret — never in the browser, never in git)
3. Copy `.env.example` to `.env.local` and fill in those three values, plus `NEXT_PUBLIC_SITE_URL=http://localhost:3000` for now.

### Run the database migrations

Using the Supabase CLI (recommended):

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF   # found in your project URL
supabase db push                               # applies supabase/migrations/*.sql
```

If you'd rather not install the CLI: open **SQL Editor** in the Supabase dashboard and paste-run `supabase/migrations/0001_init.sql`, then `supabase/migrations/0002_storage.sql`, in that order.

### Regenerate types against the real database (optional but recommended)

`src/lib/database.types.ts` was hand-written to match the migration file. Once linked, regenerate it for perfect accuracy:

```bash
npx supabase gen types typescript --linked > src/lib/database.types.ts
```

### Seed placeholder demo products

```bash
npm run seed
```

This adds Shirts/Hats categories and 6 clearly-labeled placeholder products so you can see the site working before uploading real inventory.

### Create your admin login

There is no public sign-up for `/admin` by design. Create your own login:

1. Supabase dashboard → **Authentication → Users → Add user**. Set an email and password (or send a magic link, then set a password later).
2. Copy the new user's **User UID**.
3. Supabase dashboard → **SQL Editor**, run:
   ```sql
   insert into public.admin_users (user_id, display_name)
   values ('PASTE-THE-USER-UID-HERE', 'Your Name');
   ```
4. You can now log in at `/admin/login` with that email/password.

To add a second admin (e.g. a manager) later, repeat this with their user.

## 3. Create the Stripe account

1. Stripe dashboard → **Developers → API keys**. Copy the **Publishable key** and **Secret key** (use the **test mode** keys while developing) into `.env.local`:
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_SECRET_KEY`
2. Webhook (for local dev): install the [Stripe CLI](https://docs.stripe.com/stripe-cli), then:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   It prints a `whsec_...` value — put that in `.env.local` as `STRIPE_WEBHOOK_SECRET`. Keep this command running while you test checkout locally.
3. (Optional) **Stripe Tax**: if you want automatic sales tax calculation, activate Stripe Tax in the dashboard (Settings → Tax) and set `STRIPE_AUTOMATIC_TAX_ENABLED=true` in your environment. Leave it unset/false until Tax is actually activated — Checkout session creation will error otherwise.
4. Use Stripe's [test card numbers](https://docs.stripe.com/testing) (e.g. `4242 4242 4242 4242`, any future expiry, any CVC) to test a full purchase before going live.
5. When ready for real payments, switch to your **live** API keys and create a **live-mode** webhook endpoint (see DEPLOYMENT.md) — test and live are separate configurations in Stripe.

## 4. Run it locally

```bash
npm run dev
```

Visit `http://localhost:3000` for the storefront and `http://localhost:3000/admin` for the admin panel.

## 5. Run the tests

```bash
npm run build && npm run start   # in one terminal
npm run test:e2e                 # in another
```

The admin end-to-end test needs a real admin login:

```bash
ADMIN_TEST_EMAIL=you@example.com ADMIN_TEST_PASSWORD=yourpassword npm run test:e2e
```

Use a dedicated test admin account, not your primary one, if you're running this against a shared database.

## Environment variable reference

See `.env.example` for the full list with comments. Never commit `.env` or `.env.local`.
