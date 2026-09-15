"use client";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * Browser-only client used specifically for password recovery.
 *
 * The rest of the app uses @supabase/ssr + PKCE. Password recovery is
 * intentionally isolated to the implicit flow so the emailed recovery link
 * can be opened from Gmail/Safari or another browser context without relying
 * on a PKCE verifier cookie created when the reset was requested.
 */
export function createRecoveryClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: "implicit",
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
        storageKey: "aircarecrew-admin-recovery",
      },
    }
  );
}
