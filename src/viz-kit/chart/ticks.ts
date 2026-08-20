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

/**
 * Indices of every `step`th year in a plain "YYYY" label array (as opposed
 * to `yearTicks`, which expects monthly "YYYY-MM" labels). Always includes
 * the first and last index so the axis endpoints are labeled.
 */
export function evenYearTicks(labels: string[], step = 25): number[] {
  const indices: number[] = [];

  labels.forEach((label, i) => {
    const year = Number(label);
    if (!Number.isNaN(year) && year % step === 0) indices.push(i);
  });

  if (indices[0] !== 0) indices.unshift(0);
  const lastIndex = labels.length - 1;
  if (indices[indices.length - 1] !== lastIndex) indices.push(lastIndex);

  return indices;
}

/**
 * "1-2-5" log-scale gridline values (…, 10, 20, 50, 100, 200, 500, …)
 * covering [min, max]. scaleLinear's `.ticks()` doesn't apply to log
 * domains, and scaleLog's own `.ticks()` can return a dense, uneven set
 * spanning many decades - this is the conventional log-chart alternative.
 */
export function logTicks(min: number, max: number): number[] {
  if (!(min > 0) || !(max > 0) || min >= max) return [];

  const ticks: number[] = [];
  let power = 10 ** Math.floor(Math.log10(min));
  while (power <= max) {
    for (const mult of [1, 2, 5]) {
      const t = power * mult;
      if (t >= min && t <= max) ticks.push(t);
    }
    power *= 10;
  }

  return ticks;
}
