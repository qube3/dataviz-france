/**
 * Indices of January (or every `everyYears`th year) in a "YYYY-MM" label
 * array, for sparse x-axis ticks on a dense monthly time series. Always
 * includes the first and last index so the axis endpoints are labeled.
 */
export function yearTicks(labels: string[], everyYears = 5): number[] {
  const indices: number[] = [];

  labels.forEach((label, i) => {
    const [yearStr, month] = label.split('-');
    if (month !== '01') return;
    if (Number(yearStr) % everyYears === 0) indices.push(i);
  });

  if (indices[0] !== 0) indices.unshift(0);
  const lastIndex = labels.length - 1;
  if (indices[indices.length - 1] !== lastIndex) indices.push(lastIndex);

  return indices;
}
