"use client";

import { useActionState, useState } from "react";
import type { StoreSettings } from "@/lib/types";
import { updateSettings, type FormState } from "@/app/admin/settings/actions";

export function SettingsForm({ settings }: { settings: StoreSettings }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(updateSettings, {});

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      {state.error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
      {state.success && <p className="rounded-md bg-green-50 p-3 text-sm text-green-700">Settings saved.</p>}

      <Field label="Store name">
        <input name="store_name" defaultValue={settings.store_name} required className="admin-input" />
      </Field>
      <Field label="Store email">
        <input type="email" name="store_email" defaultValue={settings.store_email} required className="admin-input" />
      </Field>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" name="announcement_bar_enabled" defaultChecked={settings.announcement_bar_enabled} />
        Show announcement bar
      </label>
      <Field label="Announcement text">
        <input name="announcement_bar_text" defaultValue={settings.announcement_bar_text ?? ""} className="admin-input" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Default shipping (USD)">
          <DollarsInput name="default_shipping_cents" defaultCents={settings.default_shipping_cents} />
        </Field>
        <Field label="Free shipping over (USD)" hint="Leave blank to disable">
          <DollarsInput name="free_shipping_threshold_cents" defaultCents={settings.free_shipping_threshold_cents ?? undefined} />
        </Field>
      </div>

      <Field label="Return policy summary">
        <textarea name="return_policy_summary" defaultValue={settings.return_policy_summary} rows={3} className="admin-input" />
      </Field>

      <Field label="Footer disclaimer text">
        <textarea name="footer_text" defaultValue={settings.footer_text} rows={2} className="admin-input" />
      </Field>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" name="maintenance_mode" defaultChecked={settings.maintenance_mode} />
        Maintenance mode (hides the storefront from everyone)
      </label>

      <button type="submit" disabled={pending} className="btn-primary mt-2 self-start">
        {pending ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}

function DollarsInput({ name, defaultCents }: { name: string; defaultCents?: number }) {
  const [dollars, setDollars] = useState(defaultCents !== undefined ? (defaultCents / 100).toFixed(2) : "");
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-graphite-600">$</span>
      <input
        type="number"
        step="0.01"
        min={0}
        value={dollars}
        onChange={(e) => setDollars(e.target.value)}
        className="admin-input pl-6"
      />
      <input type="hidden" name={name} value={dollars ? Math.round(parseFloat(dollars) * 100) : ""} />
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium">
      {label}
      {children}
      {hint && <span className="text-xs font-normal text-graphite-600">{hint}</span>}
    </label>
  );
}
