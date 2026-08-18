import type { ReactNode } from 'react';
import './CategoricalLegend.css';

export interface LegendEntry {
  label: string;
  color: string;
}

export interface CategoricalLegendProps {
  entries: LegendEntry[];
}

export function CategoricalLegend({ entries }: CategoricalLegendProps): ReactNode {
  return (
    <div className="viz-legend-items">
      {entries.map(({ label, color }) => (
        <div key={label} className="viz-legend-item">
          <div className="viz-legend-color" style={{ backgroundColor: color }} />
          <span className="viz-legend-label">{label}</span>
        </div>
      ))}
    </div>
  );
}
