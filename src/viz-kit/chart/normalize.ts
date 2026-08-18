/**
 * Rescales a series so its first non-null value becomes 1, preserving null
 * gaps. Returns an all-null series if there is no non-null value to anchor on.
 */
export function normalizeToFirst(values: (number | null)[]): (number | null)[] {
  const base = values.find((v) => v !== null && v !== 0);
  if (base == null) return values.map(() => null);

  return values.map((v) => (v === null ? null : v / base));
}
