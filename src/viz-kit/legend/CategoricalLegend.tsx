import type { ReactNode } from 'react';
import './CategoricalLegend.css';

export interface LegendEntry {
  label: string;
  color: string;
}

export interface CategoricalLegendProps {
  entries: LegendEntry[];
  /** Caps the rendered list so the legend box never grows/shrinks between frames. */
  maxItems?: number;
}

const DEFAULT_MAX_ITEMS = 6;

export function CategoricalLegend({ entries, maxItems = DEFAULT_MAX_ITEMS }: CategoricalLegendProps): ReactNode {
  return (
    <div className="viz-legend-items">
      {entries.slice(0, maxItems).map(({ label, color }) => (
        <div key={label} className="viz-legend-item">
          <div className="viz-legend-color" style={{ backgroundColor: color }} />
          <span className="viz-legend-label">{label}</span>
        </div>
      ))}
    </div>
  );
}
