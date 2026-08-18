import { useCallback } from 'react';
import { useJsonResource } from '../../viz-kit/data/useJsonResource';

export interface PrixItem {
  id: string;
  emoji: string;
  label: string;
  color: string;
  values: (number | null)[];
}

export interface PrixDataset {
  months: string[];
  items: PrixItem[];
}

const FRENCH_MONTHS = [
  'janv.',
  'févr.',
  'mars',
  'avr.',
  'mai',
  'juin',
  'juil.',
  'août',
  'sept.',
  'oct.',
  'nov.',
  'déc.',
];

function formatMonthLabel(month: string): string {
  const [year, m] = month.split('-');
  return `${FRENCH_MONTHS[Number(m) - 1]} ${year}`;
}

export function usePrixData() {
  const { data, loading, error } = useJsonResource<PrixDataset>('/data/prix/prix-alimentaires.json');

  const frameCount = data ? data.months.length : 0;

  const labelAt = useCallback((frame: number) => (data ? formatMonthLabel(data.months[frame]) : ''), [data]);

  return {
    loading,
    error,
    months: data?.months ?? [],
    frameCount,
    labelAt,
    items: data?.items ?? [],
  };
}
