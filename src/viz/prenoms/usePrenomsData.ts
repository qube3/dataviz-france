import { useCallback, useMemo } from 'react';
import { useJsonResource } from '../../viz-kit/data/useJsonResource';
import { useTopology } from '../../viz-kit/data/useTopology';
import { colorForIndex, RARE_COLOR } from '../../viz-kit/color/palette';
import type { LegendEntry } from '../../viz-kit/legend/CategoricalLegend';

export interface PrenomsDataset {
  years: [number, number];
  departments: string[];
  names: string[];
  series: Record<string, number[][]>;
  counts: Record<string, number[][]>;
}

export interface PrenomsFrame {
  colorFor: (dptCode: string) => string;
  tooltipFor: (dptCode: string) => string | undefined;
  legendEntries: LegendEntry[];
}

const TOP_N = 8;
const EMPTY_FRAME: PrenomsFrame = {
  colorFor: () => RARE_COLOR,
  tooltipFor: () => undefined,
  legendEntries: [],
};

export function usePrenomsData() {
  const prenoms = useJsonResource<PrenomsDataset>('/data/prenoms/prenoms.json');
  const geo = useTopology('/data/geo/fr-departements.topo.json');

  const frameCount = prenoms.data ? prenoms.data.years[1] - prenoms.data.years[0] + 1 : 0;

  const labelAt = useCallback(
    (frame: number) => (prenoms.data ? String(prenoms.data.years[0] + frame) : ''),
    [prenoms.data],
  );

  const deptIndex = useMemo(() => {
    const map = new Map<string, number>();
    prenoms.data?.departments.forEach((code, i) => map.set(code, i));
    return map;
  }, [prenoms.data]);

  // Derives, per (gender, frame): the top-8 most popular names that frame
  // (by summed department-winner counts), a stable color per name (its
  // rank in the whole dataset's popularity order, precomputed at build
  // time into `names`), and the "_RARE" bucket for everything else.
  // Mirrors getNameGrouping/buildColorMap/updateMap from the original
  // static/js/d3-map.js, memoized per frame instead of recomputed on
  // every render.
  const frameFor = useCallback(
    (gender: 1 | 2, frame: number): PrenomsFrame => {
      const data = prenoms.data;
      if (!data) return EMPTY_FRAME;

      const rowNames = data.series[String(gender)]?.[frame];
      const rowCounts = data.counts[String(gender)]?.[frame];
      if (!rowNames || !rowCounts) return EMPTY_FRAME;

      const totalByName = new Map<number, number>();
      rowNames.forEach((nameIdx, i) => {
        if (nameIdx < 0) return;
        totalByName.set(nameIdx, (totalByName.get(nameIdx) ?? 0) + rowCounts[i]);
      });

      const topNameIdx = [...totalByName.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, TOP_N)
        .map(([idx]) => idx);
      const topSet = new Set(topNameIdx);
      const hasRare = rowNames.some((nameIdx) => nameIdx >= 0 && !topSet.has(nameIdx));

      const colorFor = (dptCode: string): string => {
        const dptIdx = deptIndex.get(dptCode) ?? -1;
        const nameIdx = dptIdx >= 0 ? rowNames[dptIdx] : -1;
        if (nameIdx < 0 || !topSet.has(nameIdx)) return RARE_COLOR;
        return colorForIndex(nameIdx);
      };

      const tooltipFor = (dptCode: string): string | undefined => {
        const dptIdx = deptIndex.get(dptCode) ?? -1;
        const nameIdx = dptIdx >= 0 ? rowNames[dptIdx] : -1;
        if (nameIdx < 0) return undefined;
        return `${data.names[nameIdx]} (${rowCounts[dptIdx]})`;
      };

      const legendEntries: LegendEntry[] = topNameIdx.map((idx) => ({
        label: data.names[idx],
        color: colorForIndex(idx),
      }));
      if (hasRare) legendEntries.push({ label: 'Autres', color: RARE_COLOR });

      return { colorFor, tooltipFor, legendEntries };
    },
    [prenoms.data, deptIndex],
  );

  return {
    loading: prenoms.loading || geo.loading,
    error: prenoms.error ?? geo.error,
    features: geo.features,
    frameCount,
    labelAt,
    frameFor,
  };
}
