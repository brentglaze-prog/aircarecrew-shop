# Deployment (Vercel + GoDaddy)

This project could not be deployed from the environment it was written in (no network access to Vercel, Supabase, Stripe, or GitHub — see the handoff notes you received alongside this codebase). These are the exact steps to finish it from a normal machine with real access.

## 1. Push to GitHub

```bash
cd aircarecrew-shop
git add -A
git commit -m "Initial commit: AirCareCrew.shop"
gh repo create aircarecrew-shop --private --source=. --push
# or, without gh: create an empty private repo named aircarecrew-shop on
# github.com, then:
#   git remote add origin git@github.com:YOUR-USERNAME/aircarecrew-shop.git
#   git push -u origin main
```

## 2. Import into Vercel

1. [vercel.com/new](https://vercel.com/new) → import the `aircarecrew-shop` GitHub repo.
2. Framework preset: **Next.js** (auto-detected).
3. Before the first deploy, add all environment variables from `.env.example` under **Project Settings → Environment Variables**, set for **Production** (and **Preview** if you want preview deployments to work against the same Supabase project — or create a separate Supabase project for previews):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_SECRET_KEY` (live key, once you're ready for real payments)
   - `STRIPE_WEBHOOK_SECRET` (from step 3 below — you'll come back and set this)
   - `NEXT_PUBLIC_SITE_URL=https://aircarecrew.shop`
   - `STRIPE_AUTOMATIC_TAX_ENABLED` (only if you've activated Stripe Tax)
4. Deploy.
5. Open the deployment logs. If the build fails, the error will point at the exact file/line — fix it, commit, push, and Vercel redeploys automatically. Don't stop at the first failure; keep iterating until the build is green.
6. Once deployed, visit the `*.vercel.app` URL Vercel gives you and smoke-test: homepage loads, a product page loads, `/admin/login` loads.

## 3. Add the Stripe webhook (production)

1. Stripe dashboard (in **live mode**, once you're ready for real payments — use test mode first) → **Developers → Webhooks → Add endpoint**.
2. Endpoint URL: `https://aircarecrew.shop/api/webhooks/stripe`
3. Events to send: `checkout.session.completed` and `checkout.session.async_payment_succeeded`.
4. Copy the **Signing secret** (`whsec_...`) and set it as `STRIPE_WEBHOOK_SECRET` in Vercel's environment variables, then redeploy (env var changes require a redeploy to take effect).
5. Place a real test order (Stripe test mode + test card `4242 4242 4242 4242`) and confirm an order appears in **Admin → Orders** and the purchased variant's stock decreased.

## 4. Point aircarecrew.shop at Vercel

1. In Vercel: **Project → Settings → Domains** → add `aircarecrew.shop` and `www.aircarecrew.shop`.
2. Vercel will show you the exact DNS records it needs **at that moment** — always use what Vercel's dashboard displays over any instructions below, since these values can change. As of this writing, Vercel's standard requirement for an apex domain plus `www` is:

| Type | Host | Value | TTL |
|---|---|---|---|
| A | @ | `76.76.21.21` | 1 hour (3600) |
| CNAME | www | `cname.vercel-dns.com` | 1 hour (3600) |

3. In GoDaddy: **My Products → DNS → Manage DNS** for aircarecrew.shop. Remove any existing conflicting `A` record on `@` (GoDaddy's default parked-domain record) and any conflicting `CNAME` on `www`, then add the two records above with the values Vercel actually showed you.
4. In Vercel, set `aircarecrew.shop` as the **primary** domain and `www.aircarecrew.shop` to **redirect** to it (or vice versa — either is fine; pick one canonical version and stick with it for SEO). Vercel's domain settings screen has a toggle for this.
5. DNS propagation is usually under an hour but can take up to 48. Vercel's dashboard shows a green checkmark once it verifies; it also auto-provisions the HTTPS certificate once DNS resolves correctly — no separate action needed.
6. Update `NEXT_PUBLIC_SITE_URL` in Vercel to `https://aircarecrew.shop` if you haven't already, and redeploy.

## 5. Post-launch checklist

- [ ] Place one real end-to-end test order with a real card for a small amount, then refund it from Stripe, to confirm live-mode payments actually work.
- [ ] Replace the placeholder demo products (`npm run seed`) with real inventory, or delete/archive them from Admin.
- [ ] Replace the starter Privacy Policy and Terms copy (`src/app/privacy`, `src/app/terms`) with reviewed copy if you want fully tailored legal terms.
- [ ] Set `robots.txt` / sitemap are reachable: `https://aircarecrew.shop/robots.txt` and `/sitemap.xml`.
- [ ] Confirm the favicon/OG image (`public/favicon.ico`, `public/og-image.png`) look right — these are placeholder marks generated for this project and can be swapped for a refined logo anytime.
- [ ] Add a second admin account for anyone else who needs store access (SETUP.md).

## Extending later (not required for launch)

- **Transactional email beyond Stripe's receipt** (e.g. a branded shipping-confirmation email): add [Resend](https://resend.com) and call it from `src/app/admin/orders/actions.ts` when fulfillment status changes to Shipped. Nothing in this codebase blocks that.
- **Google Analytics**: the app currently ships with no analytics wired in beyond what Vercel provides natively (Vercel Analytics can be enabled with zero code changes from the Vercel dashboard). Add GA by dropping its script into `src/app/layout.tsx` when you're ready.
- **More shipping sophistication** (carrier-calculated rates, multiple zones): replace the flat-rate logic in `src/app/api/checkout/route.ts` — it's isolated to one place.
