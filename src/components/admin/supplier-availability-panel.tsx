import {
  bulkSetSupplierAvailability,
  setSupplierVariantAvailability,
} from "@/app/admin/products/supplier-actions";
import type { SupplierAwareVariant } from "@/lib/types";

const STATUS_OPTIONS = [
  ["unverified", "Needs verification"],
  ["available", "Available"],
  ["low_stock", "Low stock"],
  ["sold_out", "Sold out"],
] as const;

export function SupplierAvailabilityPanel({
  productId,
  variants,
  vendorUrl,
}: {
  productId: string;
  variants: SupplierAwareVariant[];
  vendorUrl?: string | null;
}) {
  const supplierVariants = variants.filter((v) => v.inventory_mode === "supplier");
  if (supplierVariants.length === 0) return null;

  return (
    <div className="max-w-4xl rounded-lg border border-graphite-950/10 bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold">Supplier availability</h3>
          <p className="mt-1 max-w-2xl text-xs text-graphite-600">
            Checkout is allowed only while a supplier variant is marked Available or Low stock and its verification window is still current. Recheck Queensboro before extending availability.
          </p>
        </div>
        {vendorUrl && (
          <a
            href={vendorUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-careblue-700 underline"
          >
            Open Queensboro product ↗
          </a>
        )}
      </div>

      <form action={bulkSetSupplierAvailability} className="mt-4 grid gap-3 rounded-md bg-graphite-950/[0.03] p-3 sm:grid-cols-5 sm:items-end">
        <input type="hidden" name="product_id" value={productId} />
        <label className="flex flex-col gap-1 text-xs font-medium sm:col-span-2">
          All active variants
          <select name="supplier_status" defaultValue="available" className="admin-input">
            {STATUS_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium">
          Verify for hours
          <input name="verify_hours" type="number" min={1} max={168} defaultValue={72} className="admin-input" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium">
          Max/order
          <input name="max_order_quantity" type="number" min={1} max={25} defaultValue={5} className="admin-input" />
        </label>
        <button type="submit" className="btn-secondary">Apply to all</button>
      </form>

      <div className="mt-4 overflow-x-auto">
        <table className="admin-table w-full text-sm">
          <thead className="bg-graphite-950/5">
            <tr>
              <th>Variant</th>
              <th>Status</th>
              <th>Verified until</th>
              <th>Max/order</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {supplierVariants.map((variant) => (
              <SupplierVariantRow key={variant.id} productId={productId} variant={variant} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SupplierVariantRow({ productId, variant }: { productId: string; variant: SupplierAwareVariant }) {
  const label = [variant.size, variant.color].filter(Boolean).join(" • ") || variant.sku;
  const verifiedUntil = variant.supplier_verified_until
    ? new Date(variant.supplier_verified_until).toLocaleString()
    : "—";

  return (
    <tr className="border-t border-graphite-950/10">
      <td>
        <span className="font-medium">{label}</span>
        <span className="block font-mono text-[11px] text-graphite-600">{variant.sku}</span>
      </td>
      <td colSpan={4}>
        <form action={setSupplierVariantAvailability} className="grid gap-2 sm:grid-cols-[minmax(140px,1fr)_180px_90px_auto] sm:items-center">
          <input type="hidden" name="product_id" value={productId} />
          <input type="hidden" name="variant_id" value={variant.id} />
          <select name="supplier_status" defaultValue={variant.supplier_status} className="admin-input">
            {STATUS_OPTIONS.map(([value, optionLabel]) => (
              <option key={value} value={value}>{optionLabel}</option>
            ))}
          </select>
          <div className="text-xs text-graphite-600">
            <span className="block sm:hidden">Verified until</span>
            {verifiedUntil}
          </div>
          <input
            name="max_order_quantity"
            type="number"
            min={1}
            max={25}
            defaultValue={variant.max_order_quantity}
            className="admin-input"
            aria-label="Maximum quantity per order"
          />
          <div className="flex items-center gap-2">
            <input name="verify_hours" type="hidden" value="72" />
            <button type="submit" className="btn-secondary min-h-[40px] px-3 py-2 text-xs">Save</button>
          </div>
        </form>
      </td>
    </tr>
  );
}
