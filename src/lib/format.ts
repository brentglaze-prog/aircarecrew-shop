/** Client- and server-safe formatting helpers (no "server-only" import). */

export function formatCents(cents: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

export function variantLabel(size: string | null, color: string | null) {
  return [color, size].filter(Boolean).join(" / ") || null;
}
