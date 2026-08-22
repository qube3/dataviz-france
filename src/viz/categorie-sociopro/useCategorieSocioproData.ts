import { useCallback, useMemo } from 'react';
import { useJsonResource } from '../../viz-kit/data/useJsonResource';

interface CategorieSeries {
  id: string;
  label: string;
  color: string;
  values: number[];
}

interface CategorieSocioproDataset {
  years: number[];
  series: CategorieSeries[];
}

export function useCategorieSocioproData() {
  const { data, loading, error } = useJsonResource<CategorieSocioproDataset>(
    '/data/economie/categorie-sociopro.json',
  );

  const years = useMemo(() => (data ? data.years.map(String) : []), [data]);
  const frameCount = years.length;
  const labelAt = useCallback((frame: number) => years[frame] ?? '', [years]);
  const series = data?.series ?? [];

  return { loading, error, years, frameCount, labelAt, series };
}
