import type { ReactNode } from 'react';
import type { Feature, Geometry, GeoJsonProperties } from 'geojson';
import './ChoroplethMap.css';
import { useProjection } from './useProjection';
import { useResizeObserver } from './useResizeObserver';

export interface ChoroplethMapProps {
  features: Feature<Geometry, GeoJsonProperties>[];
  regionId?: (f: Feature<Geometry, GeoJsonProperties>) => string;
  fillFor: (regionId: string) => string;
  tooltipFor?: (regionId: string) => string | undefined;
  ariaLabel: string;
}

const defaultRegionId = (f: Feature<Geometry, GeoJsonProperties>): string =>
  (f.properties?.code as string | undefined) ?? '';

export function ChoroplethMap({
  features,
  regionId = defaultRegionId,
  fillFor,
  tooltipFor,
  ariaLabel,
}: ChoroplethMapProps): ReactNode {
  const [containerRef, { width, height }] = useResizeObserver<HTMLDivElement>();
  const projected = useProjection(features, width, height);

  return (
    <div ref={containerRef} className="viz-choropleth" role="img" aria-label={ariaLabel}>
      {width > 0 && height > 0 && (
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
          {projected.map(({ feature, d }) => {
            const id = regionId(feature);
            const tooltip = tooltipFor?.(id);
            return (
              <path key={id} d={d} className="department" fill={fillFor(id)}>
                {tooltip && <title>{tooltip}</title>}
              </path>
            );
          })}
        </svg>
      )}
    </div>
  );
}
