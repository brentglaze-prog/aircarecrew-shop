"use client";

import { useActionState } from "react";
import type { Category } from "@/lib/types";
import type { FormState } from "@/app/admin/categories/actions";

export function CategoryForm({
  category,
  action,
}: {
  category?: Category;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      {state.error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}

      <Field label="Name" error={state.fieldErrors?.name}>
        <input name="name" defaultValue={category?.name} required className="admin-input" />
      </Field>

      <Field label="Slug" hint="Used in the URL, e.g. /shop/hats" error={state.fieldErrors?.slug}>
        <input name="slug" defaultValue={category?.slug} required className="admin-input" />
      </Field>

      <Field label="Description" error={state.fieldErrors?.description}>
        <textarea name="description" defaultValue={category?.description ?? ""} rows={3} className="admin-input" />
      </Field>

      <Field label="Image URL" hint="Optional" error={state.fieldErrors?.image_url}>
        <input name="image_url" defaultValue={category?.image_url ?? ""} className="admin-input" />
      </Field>

      <Field label="Display order" error={state.fieldErrors?.display_order}>
        <input
          type="number"
          name="display_order"
          defaultValue={category?.display_order ?? 0}
          className="admin-input"
        />
      </Field>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" name="is_visible" defaultChecked={category?.is_visible ?? true} />
        Visible on storefront
      </label>

      <button type="submit" disabled={pending} className="btn-primary mt-2 self-start">
        {pending ? "Saving…" : "Save category"}
      </button>
    </form>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium">
      {label}
      {children}
      {hint && !error && <span className="text-xs font-normal text-graphite-600">{hint}</span>}
      {error && <span className="text-xs font-normal text-red-600">{error}</span>}
    </label>
  );
}
