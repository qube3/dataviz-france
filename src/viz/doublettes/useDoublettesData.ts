import { useCallback, useMemo } from 'react';
import { useJsonResource } from '../../viz-kit/data/useJsonResource';
import { colorForIndex, RARE_COLOR } from '../../viz-kit/color/palette';

export type Gender = 'filles' | 'garcons';

interface DoubletteEntry {
  id: string;
  label: string;
  filles: number[];
  garcons: number[];
  rare?: true;
}

interface DoublettesDataset {
  years: number[];
  doublettes: DoubletteEntry[];
}

export interface DoubletteItem {
  id: string;
  label: string;
  color: string;
  values: number[];
}

export function useDoublettesData() {
  const { data, loading, error } = useJsonResource<DoublettesDataset>('/data/doublettes/doublettes.json');

  const years = useMemo(() => (data ? data.years.map(String) : []), [data]);
  const frameCount = years.length;
  const labelAt = useCallback((frame: number) => years[frame] ?? '', [years]);

  // Same doublette index -> same color in both gender panels, since it's the
  // identical 16-category list compared side by side (unlike prenoms-top5,
  // where female/male name pools are disjoint).
  const itemsFor = useCallback(
    (gender: Gender): DoubletteItem[] =>
      (data?.doublettes ?? []).map((entry, i) => ({
        id: entry.id,
        label: entry.label,
        color: entry.rare ? RARE_COLOR : colorForIndex(i),
        values: entry[gender],
      })),
    [data],
  );

  return { loading, error, years, frameCount, labelAt, itemsFor };
}
