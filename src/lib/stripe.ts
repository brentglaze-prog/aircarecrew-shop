import "server-only";
import Stripe from "stripe";

let cachedClient: Stripe | null = null;

/**
 * Vercel's production deployment must never create test-mode payment sessions.
 * Preview/local environments may use Stripe test credentials.
 */
export function isProductionDeployment(): boolean {
  return process.env.VERCEL_ENV === "production";
}

export function hasLiveStripeCredentials(): boolean {
  return (
    process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_") === true &&
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith("pk_live_") === true
  );
}

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
