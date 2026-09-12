import "server-only";
import { requireAdmin } from "@/lib/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Standard entry point for every admin server action and admin data
 * loader: confirms the caller is a logged-in admin (requireAdmin, using
 * the caller's own session — enforced by the admin_users RLS policy), then
 * hands back a service-role client for the actual read/write, since admin
 * screens need to see draft/archived data that RLS hides from anon/authenticated.
 */
export async function getAdminContext() {
  const user = await requireAdmin();
  return { user, db: createAdminClient() };
}
