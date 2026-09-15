"use client";

import { useActionState, useState } from "react";
import type { Category, Product, SupplierAwareVariant } from "@/lib/types";
import type { FormState } from "@/app/admin/products/actions";

type VariantRow = {
  id?: string;
  sku: string;
  size: string;
  color: string;
  inventory_quantity: number;
  inventory_mode: "owned" | "supplier";
  is_active: boolean;
  display_order: number;
};

function toRows(variants?: SupplierAwareVariant[]): VariantRow[] {
  if (!variants || variants.length === 0) {
    return [
      {
        sku: "",
        size: "",
        color: "",
        inventory_quantity: 0,
        inventory_mode: "owned",
        is_active: true,
        display_order: 0,
      },
    ];
  }
  return variants.map((v) => ({
    id: v.id,
    sku: v.sku,
    size: v.size ?? "",
    color: v.color ?? "",
    inventory_quantity: v.inventory_quantity,
    inventory_mode: v.inventory_mode,
    is_active: v.is_active,
    display_order: v.display_order,
  }));
}

export function ProductForm({
  product,
  variants,
  categories,
  action,
}: {
  product?: Product;
  variants?: SupplierAwareVariant[];
  categories: Category[];
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});
  const [rows, setRows] = useState<VariantRow[]>(toRows(variants));

  function updateRow(index: number, patch: Partial<VariantRow>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }
  function addRow() {
    setRows((prev) => [
      ...prev,
      {
        sku: "",
        size: "",
        color: "",
        inventory_quantity: 0,
        inventory_mode: "owned",
        is_active: true,
        display_order: prev.length,
      },
    ]);
  }
  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <form action={formAction} className="flex max-w-3xl flex-col gap-6">
      {state.error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" error={state.fieldErrors?.name}>
          <input name="name" defaultValue={product?.name} required className="admin-input" />
        </Field>
        <Field label="Slug" hint="Used in the URL, e.g. /product/crew-tee" error={state.fieldErrors?.slug}>
          <input name="slug" defaultValue={product?.slug} required className="admin-input" />
        </Field>
      </div>

      <Field label="Category" error={state.fieldErrors?.category_id}>
        <select name="category_id" defaultValue={product?.category_id ?? ""} className="admin-input">
          <option value="">Uncategorized</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Short description" hint="Shown on product cards and near the title" error={state.fieldErrors?.short_description}>
        <input name="short_description" defaultValue={product?.short_description ?? ""} className="admin-input" />
      </Field>

      <Field label="Full description" error={state.fieldErrors?.description}>
        <textarea name="description" defaultValue={product?.description ?? ""} rows={5} className="admin-input" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Price (USD)" error={state.fieldErrors?.price_cents}>
          <PriceInput name="price_cents" defaultCents={product?.price_cents} />
        </Field>
        <Field label="Compare-at price (USD)" hint="Optional — shows as strikethrough" error={state.fieldErrors?.compare_at_price_cents}>
          <PriceInput name="compare_at_price_cents" defaultCents={product?.compare_at_price_cents ?? undefined} />
        </Field>
        <Field label="Display order" error={state.fieldErrors?.display_order}>
          <input type="number" name="display_order" defaultValue={product?.display_order ?? 0} className="admin-input" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Status" error={state.fieldErrors?.status}>
          <select name="status" defaultValue={product?.status ?? "draft"} className="admin-input">
            <option value="draft">Draft (hidden)</option>
            <option value="active">Active (live)</option>
            <option value="archived">Archived</option>
          </select>
        </Field>
        <label className="mt-6 flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" name="is_featured" defaultChecked={product?.is_featured ?? false} />
          Featured on homepage
        </label>
      </div>

      <details className="rounded-md border border-graphite-950/10 p-4">
        <summary className="cursor-pointer text-sm font-semibold">SEO (optional)</summary>
        <div className="mt-3 grid gap-4">
          <Field label="SEO title">
            <input name="seo_title" defaultValue={product?.seo_title ?? ""} className="admin-input" />
          </Field>
          <Field label="SEO description">
            <textarea name="seo_description" defaultValue={product?.seo_description ?? ""} rows={2} className="admin-input" />
          </Field>
        </div>
      </details>

      <fieldset className="rounded-md border border-graphite-950/10 p-4">
        <legend className="px-1 text-sm font-semibold">
          Variants — leave size/color blank for a single simple product
        </legend>
        {state.fieldErrors?.variants && <p className="mt-1 text-xs text-red-600">{state.fieldErrors.variants}</p>}

        <div className="mt-3 flex flex-col gap-3">
          {rows.map((row, i) => (
            <div key={i} className="grid grid-cols-2 gap-2 rounded border border-graphite-950/10 p-3 sm:grid-cols-6">
              <input
                placeholder="SKU"
                value={row.sku}
                onChange={(e) => updateRow(i, { sku: e.target.value })}
                required
                className="admin-input col-span-2 sm:col-span-2"
              />
              <input
                placeholder="Size (optional)"
                value={row.size}
                onChange={(e) => updateRow(i, { size: e.target.value })}
                className="admin-input"
              />
              <input
                placeholder="Color (optional)"
                value={row.color}
                onChange={(e) => updateRow(i, { color: e.target.value })}
                className="admin-input"
              />
              {row.inventory_mode === "supplier" ? (
                <div className="flex min-h-[44px] items-center rounded-md border border-careblue-300 bg-careblue-200/40 px-3 text-xs font-semibold text-careblue-700">
                  Supplier-managed
                </div>
              ) : (
                <input
                  type="number"
                  min={0}
                  placeholder="Stock"
                  value={row.inventory_quantity}
                  onChange={(e) => updateRow(i, { inventory_quantity: Number(e.target.value) })}
                  className="admin-input"
                />
              )}
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={row.is_active}
                    onChange={(e) => updateRow(i, { is_active: e.target.checked })}
                  />
                  Active
                </label>
                <button type="button" onClick={() => removeRow(i)} className="text-xs text-red-600 underline">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={addRow} className="btn-secondary mt-3">
          Add variant
        </button>
        <input type="hidden" name="variants_json" value={JSON.stringify(rows)} />
      </fieldset>

      <button type="submit" disabled={pending} className="btn-primary self-start">
        {pending ? "Saving…" : "Save product"}
      </button>
    </form>
  );
}

function PriceInput({ name, defaultCents }: { name: string; defaultCents?: number }) {
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
