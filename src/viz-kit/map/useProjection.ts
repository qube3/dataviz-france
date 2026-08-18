import { useMemo } from 'react';
import { geoMercator, geoPath } from 'd3-geo';
import type { Feature, FeatureCollection, Geometry, GeoJsonProperties } from 'geojson';

export interface ProjectedFeature {
  feature: Feature<Geometry, GeoJsonProperties>;
  d: string;
}

const PADDING = 6;

/**
 * Fits `features` into [width, height] and memoizes both the projection and
 * every path `d` string on [features, width, height] only, so a fill-only
 * change (e.g. stepping the timeline) never recomputes geometry.
 */
export function useProjection(
  features: Feature<Geometry, GeoJsonProperties>[],
  width: number,
  height: number,
): ProjectedFeature[] {
  return useMemo(() => {
    if (width <= 0 || height <= 0 || features.length === 0) return [];

    const collection: FeatureCollection = { type: 'FeatureCollection', features };
    const projection = geoMercator().fitExtent(
      [
        [PADDING, PADDING],
        [width - PADDING, height - PADDING],
      ],
      collection,
    );
    const path = geoPath(projection);

    return features.map((f) => ({ feature: f, d: path(f) ?? '' }));
  }, [features, width, height]);
}
