# Admin Guide

For running the store day-to-day. No coding, GitHub, or developer tools needed for anything below — that's the point of the admin panel.

Go to **yourdomain.com/admin** and sign in.

## Add a product

1. **Admin → Products → New product**
2. Fill in:
   - **Name** and **Slug** (the slug becomes the URL, e.g. `crew-trucker-hat` → `/product/crew-trucker-hat`)
   - **Category** (Shirts, Hats, or whatever categories you've created)
   - **Short description** (shows on the product grid) and **Full description**
   - **Price** and, optionally, a **Compare-at price** to show a strikethrough sale price
   - **Status**: leave as **Draft** while you're still setting it up; switch to **Active** when it should go live on the storefront
   - **Variants**: for a shirt, add one row per size/color combination (SKU, size, color, stock count). For a hat with no sizes, add one row per color with size left blank. For a simple product with no options at all, add a single row with size and color both left blank.
3. Click **Save product**.
4. You'll land on the product's edit page — **upload images** here (drag in a JPEG/PNG/WebP, up to 8 MB each). The first image you upload becomes the primary image automatically; use **Make primary** to change it, and the ↑/↓ buttons to reorder.
5. Once images and variants look right and Status is **Active**, the product is live.

**Duplicating a product:** on the Products list, click **Duplicate** to create a draft copy with new SKUs — handy for a new colorway of an existing design.

**Removing a product:** **Archive** hides it everywhere but keeps its order history intact (use this for anything that has ever sold). **Delete** permanently removes a product, but only works if it has never been ordered — otherwise you'll be told to archive it instead.

## Add a category

1. **Admin → Categories → New category**
2. Name, slug (e.g. `hoodies` → `/shop/hoodies`), an optional description, and a display order (lower numbers show first in the nav).
3. Save. It appears in the storefront navigation automatically — no code changes, ever.

**Deleting a category** is safe: any products in it become "uncategorized" (still visible under All Products) rather than being deleted. The confirmation dialog tells you how many products will be affected before you confirm.

## Manage inventory

Stock is tracked per variant (e.g. Black / XL has its own count). Edit a product and adjust the **Stock** number on any variant row, then save. When a variant hits 0, it shows as sold out on the storefront and can't be added to a cart — customers can still browse it if other variants of the same product are in stock.

## Fulfill an order

1. **Admin → Orders** shows every order, newest first. Filter by fulfillment status using the tabs.
2. Click an order to see the items, customer, shipping address, and totals.
3. Update **Fulfillment status** (Unfulfilled → Processing → Shipped → Completed, or Cancelled) and optionally add a **tracking number**, then **Save**.
4. Payment status (Paid/Refunded/etc.) is managed by Stripe, not here — issue refunds from your [Stripe Dashboard](https://dashboard.stripe.com/payments). The order's payment status here reflects what Stripe told us at checkout.

## Store settings

**Admin → Settings** covers things that shouldn't need a code change:

- Store name and contact email
- An announcement bar (e.g. "Free shipping this week") — toggle on/off
- Flat shipping rate and an optional free-shipping threshold
- Return policy summary and footer disclaimer text
- **Maintenance mode** — temporarily replaces the entire storefront with a simple "back soon" message (useful while you're doing a big inventory overhaul)

## Who can access Admin

Only accounts explicitly added as admins can sign in — there's no public sign-up. To add a teammate, see the "Create your admin login" steps in SETUP.md using their email instead of yours.
