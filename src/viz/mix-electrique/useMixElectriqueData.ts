import { useCallback, useMemo } from 'react';
import { useJsonResource } from '../../viz-kit/data/useJsonResource';

interface FiliereSeries {
  id: string;
  label: string;
  color: string;
  values: number[];
}

interface MixElectriqueDataset {
  years: number[];
  series: FiliereSeries[];
}

export function useMixElectriqueData() {
  const { data, loading, error } = useJsonResource<MixElectriqueDataset>('/data/energie/mix-electrique.json');

  const years = useMemo(() => (data ? data.years.map(String) : []), [data]);
  const frameCount = years.length;
  const labelAt = useCallback((frame: number) => years[frame] ?? '', [years]);
  const series = data?.series ?? [];

  return { loading, error, years, frameCount, labelAt, series };
}
