/** Human-friendly order numbers: ACC-YYYYMMDD-XXXXXX (random suffix, not sequential/guessable). */
export function generateOrderNumber(date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ACC-${y}${m}${d}-${suffix}`;
}
