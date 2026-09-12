import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";

/**
 * Server-side Supabase client for Server Components, Route Handlers, and
 * Server Actions. Uses the anon key + the visitor's auth cookie (if any) —
 * this is what /admin uses to check "is this logged-in user an admin?" via
 * the admin_users_self_select RLS policy, and what the storefront uses for
 * all public reads. It is NOT the service role client — see admin.ts.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component that can't set cookies — safe
            // to ignore as long as middleware.ts is refreshing sessions.
          }
        },
      },
    }
  );
}
