import type { ReactNode } from 'react';
import type { Feature, Geometry, GeoJsonProperties } from 'geojson';
import { ChoroplethMap } from '../../viz-kit/map/ChoroplethMap';
import { CategoricalLegend, type LegendEntry } from '../../viz-kit/legend/CategoricalLegend';
import './PrenomsMapPanel.css';

export interface PrenomsMapPanelProps {
  title: string;
  features: Feature<Geometry, GeoJsonProperties>[];
  colorFor: (dptCode: string) => string;
  tooltipFor: (dptCode: string) => string | undefined;
  legendEntries: LegendEntry[];
  ariaLabel: string;
}

export function PrenomsMapPanel({
  title,
  features,
  colorFor,
  tooltipFor,
  legendEntries,
  ariaLabel,
}: PrenomsMapPanelProps): ReactNode {
  return (
    <div className="prenoms-panel">
      <h2>{title}</h2>
      <div className="prenoms-panel-map-container">
        <div className="prenoms-panel-map">
          <ChoroplethMap features={features} fillFor={colorFor} tooltipFor={tooltipFor} ariaLabel={ariaLabel} />
        </div>
      </div>
      <div className="prenoms-panel-legend">
        <CategoricalLegend entries={legendEntries} />
      </div>
    </div>
  );
}
