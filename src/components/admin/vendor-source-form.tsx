"use client";

import { useActionState } from "react";
import { saveVendorSource, type VendorSourceFormState } from "@/app/admin/products/vendor-actions";
import type { ProductVendorLink } from "@/lib/types";

export function VendorSourceForm({
  productId,
  vendor,
}: {
  productId: string;
  vendor: ProductVendorLink | null;
}) {
  const boundAction = saveVendorSource.bind(null, productId);
  const [state, formAction, pending] = useActionState<VendorSourceFormState, FormData>(boundAction, {});

  return (
    <form action={formAction} className="max-w-3xl rounded-lg border border-graphite-950/10 bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <h3 className="text-sm font-semibold">Vendor source</h3>
          <p className="mt-1 text-xs text-graphite-600">
            Internal only. Use this to jump straight to the supplier product when ordering or restocking.
          </p>
        </div>
        {vendor?.vendor_product_url && (
          <a
            href={vendor.vendor_product_url}
            target="_blank"
            rel="noreferrer"
            className="mt-2 text-xs font-semibold text-careblue-700 underline sm:mt-0"
          >
            Open vendor product ↗
          </a>
        )}
      </div>

      {state.error && <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
      {state.success && <p className="mt-4 rounded-md bg-green-50 p-3 text-sm text-green-700">Vendor source saved.</p>}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Vendor name
          <input name="vendor_name" defaultValue={vendor?.vendor_name ?? ""} className="admin-input" placeholder="e.g. Printful" />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Vendor SKU
          <input name="vendor_sku" defaultValue={vendor?.vendor_sku ?? ""} className="admin-input" placeholder="Optional supplier SKU" />
        </label>
      </div>

      <label className="mt-4 flex flex-col gap-1 text-sm font-medium">
        Direct product URL
        <input
          type="url"
          name="vendor_product_url"
          defaultValue={vendor?.vendor_product_url ?? ""}
          className="admin-input"
          placeholder="https://vendor.com/product/..."
        />
      </label>

      <label className="mt-4 flex flex-col gap-1 text-sm font-medium">
        Internal notes
        <textarea
          name="notes"
          defaultValue={vendor?.notes ?? ""}
          rows={3}
          className="admin-input"
          placeholder="Blank style, print location, reorder notes, etc."
        />
      </label>

      <button type="submit" disabled={pending} className="btn-secondary mt-4">
        {pending ? "Saving…" : "Save vendor source"}
      </button>
    </form>
  );
}
