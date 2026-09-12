import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Verifies the current request is from a logged-in Supabase user who is
 * also present in admin_users. Used at the top of every admin server
 * action and inside middleware.ts. Throws if not authorized — callers in
 * server actions should catch and surface a generic error; middleware
 * redirects to /admin/login instead.
 */
export async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("UNAUTHENTICATED");
  }

  const { data: adminRow, error } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !adminRow) {
    throw new Error("NOT_ADMIN");
  }

  return user;
}
