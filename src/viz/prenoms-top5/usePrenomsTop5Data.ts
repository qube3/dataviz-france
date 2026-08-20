import { useCallback, useMemo } from 'react';
import { useJsonResource } from '../../viz-kit/data/useJsonResource';
import { colorForIndex } from '../../viz-kit/color/palette';

export type Gender = '1' | '2';
export type RankMode = 'all-time' | 'rolling';

interface CandidateEntry {
  name: string;
  total: number;
  values: number[];
}

interface PrenomsTop5Dataset {
  years: [number, number];
  // Every name that was ever in the all-time top 5 or a rolling 5-year-window
  // top 5, ordered by all-time total (descending) - a superset the frontend
  // ranks either way from, so a name keeps the same color in both modes.
  candidates: Record<Gender, CandidateEntry[]>;
}

export interface Top5Item {
  id: string;
  label: string;
  color: string;
  values: number[];
}

const TOP_N = 5;
const ROLLING_WINDOW = 5;

/** The top 5 candidates by raw count summed over the trailing `ROLLING_WINDOW` years ending at `frame`. */
export function rollingTop5(candidates: Top5Item[], frame: number): Top5Item[] {
  const start = Math.max(0, frame - ROLLING_WINDOW + 1);
  return [...candidates]
    .sort((a, b) => {
      const scoreA = a.values.slice(start, frame + 1).reduce((sum, v) => sum + v, 0);
      const scoreB = b.values.slice(start, frame + 1).reduce((sum, v) => sum + v, 0);
      return scoreB - scoreA;
    })
    .slice(0, TOP_N);
}

export function usePrenomsTop5Data() {
  const { data, loading, error } = useJsonResource<PrenomsTop5Dataset>('/data/prenoms/prenoms-top5.json');

  const years = useMemo(() => {
    if (!data) return [];
    const [lo, hi] = data.years;
    return Array.from({ length: hi - lo + 1 }, (_, i) => String(lo + i));
  }, [data]);

  const frameCount = years.length;
  const labelAt = useCallback((frame: number) => years[frame] ?? '', [years]);

  /** All candidates for a gender, ordered by all-time total - i.e. its first 5 are the all-time top 5. */
  const candidatesFor = useCallback(
    (gender: Gender, colorOffset = 0): Top5Item[] =>
      (data?.candidates[gender] ?? []).map((entry, i) => ({
        id: `${gender}-${entry.name}`,
        label: entry.name,
        color: colorForIndex(i + colorOffset),
        values: entry.values,
      })),
    [data],
  );

  return { loading, error, years, frameCount, labelAt, candidatesFor };
}
