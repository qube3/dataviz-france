import { useCallback, useMemo } from 'react';
import { useJsonResource } from '../../viz-kit/data/useJsonResource';

interface PyramideDataset {
  years: number[];
  ages: number[];
  men: number[][];
  women: number[][];
}

export function usePyramideData() {
  const { data, loading, error } = useJsonResource<PyramideDataset>('/data/pyramide/pyramide.json');

  const years = useMemo(() => (data ? data.years.map(String) : []), [data]);
  const frameCount = years.length;
  const labelAt = useCallback((frame: number) => years[frame] ?? '', [years]);

  const ages = data?.ages ?? [];
  const men = data?.men ?? [];
  const women = data?.women ?? [];

  // Fixed across every frame so the magnitude axis never rescales as the
  // timeline moves - the same population count always spans the same width.
  const maxValue = useMemo(() => {
    let max = 1;
    if (!data) return max;
    for (const row of [...data.men, ...data.women]) {
      for (const v of row) if (v > max) max = v;
    }
    return max;
  }, [data]);

  return { loading, error, years, ages, men, women, frameCount, labelAt, maxValue };
}
