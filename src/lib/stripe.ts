import "server-only";
import Stripe from "stripe";

let cachedClient: Stripe | null = null;

/** Server-only Stripe client (secret key). */
export function getStripe(): Stripe {
  if (cachedClient) return cachedClient;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("Missing STRIPE_SECRET_KEY environment variable.");
  }

  cachedClient = new Stripe(key, {
    apiVersion: "2025-02-24.acacia",
    typescript: true,
    appInfo: { name: "aircarecrew-shop" },
  });

  return cachedClient;
}
