import { useCallback, useMemo } from 'react';
import { useJsonResource } from '../../viz-kit/data/useJsonResource';
import { colorForIndex } from '../../viz-kit/color/palette';

export type Gender = '1' | '2';

interface Top5NameEntry {
  name: string;
  total: number;
  values: number[];
}

interface PrenomsTop5Dataset {
  years: [number, number];
  top5: Record<Gender, Top5NameEntry[]>;
}

export interface Top5Item {
  id: string;
  label: string;
  color: string;
  values: number[];
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

  const itemsFor = useCallback(
    (gender: Gender, colorOffset = 0): Top5Item[] =>
      (data?.top5[gender] ?? []).map((entry, i) => ({
        id: `${gender}-${entry.name}`,
        label: entry.name,
        color: colorForIndex(i + colorOffset),
        values: entry.values,
      })),
    [data],
  );

  return { loading, error, years, frameCount, labelAt, itemsFor };
}
