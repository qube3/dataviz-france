import { hsl } from 'd3-color';

/** Fixed color for a viz's "everything else" / long-tail bucket. */
export const RARE_COLOR = '#95a5a6';

const HUE_STEPS = 12;
const LIGHTNESS_BANDS = [0.45, 0.62, 0.34];
const PALETTE_SIZE = 36;

/**
 * A palette of maximally-separated colors: evenly spaced hues, cycling
 * through a few lightness bands (offset per band) so consecutive palette
 * entries never look alike even when hues repeat.
 */
function generateDistinctPalette(size: number): string[] {
  const palette: string[] = [];

  for (let i = 0; i < size; i++) {
    const band = Math.floor(i / HUE_STEPS) % LIGHTNESS_BANDS.length;
    const step = i % HUE_STEPS;
    const hue = (step * (360 / HUE_STEPS) + band * (360 / HUE_STEPS / LIGHTNESS_BANDS.length)) % 360;
    palette.push(hsl(hue, 0.68, LIGHTNESS_BANDS[band]).toString());
  }

  return palette;
}

const DISTINCT_PALETTE = generateDistinctPalette(PALETTE_SIZE);

/**
 * Stable color for a popularity-ranked index (0 = most popular overall).
 * Assigning the most common items the lowest indices means items most
 * likely to appear together get the most visually distinct colors; only
 * the long tail, which rarely co-occurs, cycles back through the palette.
 */
export function colorForIndex(i: number): string {
  return DISTINCT_PALETTE[i % DISTINCT_PALETTE.length];
}
