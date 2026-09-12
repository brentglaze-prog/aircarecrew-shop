import { getAdminContext } from "@/lib/admin-context";
import { SettingsForm } from "@/components/admin/settings-form";

export default async function AdminSettingsPage() {
  const { db } = await getAdminContext();
  const { data: settings } = await db.from("store_settings").select("*").eq("id", true).maybeSingle();

  if (!settings) {
    throw new Error(
      "store_settings row is missing — this should have been created by the initial migration. See supabase/migrations/0001_init.sql."
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight">Store settings</h1>
      <div className="mt-6">
        <SettingsForm settings={settings} />
      </div>
    </div>
  );
}
