import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * Service-role Supabase client. Bypasses Row Level Security entirely.
 *
 * NEVER import this file from a Client Component, and never let
 * SUPABASE_SERVICE_ROLE_KEY reach the browser. The "server-only" import
 * above makes any accidental client-side import fail the build.
 *
 * Used only by:
 *  - src/app/api/webhooks/stripe/route.ts (recording paid orders)
 *  - src/app/admin/**\/actions.ts (server actions performing admin writes,
 *    after the caller's admin_users membership has been verified)
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY server environment variables."
    );
  }

  return createSupabaseClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
