import { useMemo } from 'react';
import { feature } from 'topojson-client';
import type { Topology, GeometryObject } from 'topojson-specification';
import type { Feature, GeoJsonProperties, Geometry, FeatureCollection } from 'geojson';
import { useJsonResource } from './useJsonResource';

export interface TopologyState {
  features: Feature<Geometry, GeoJsonProperties>[];
  loading: boolean;
  error: Error | null;
}

/** Fetches a TopoJSON file and decodes one of its objects into GeoJSON features. */
export function useTopology(url: string, objectName?: string): TopologyState {
  const { data, loading, error } = useJsonResource<Topology>(url);

  const features = useMemo(() => {
    if (!data) return [];
    const key = objectName ?? Object.keys(data.objects)[0];
    const object = data.objects[key] as GeometryObject;
    const collection = feature(data, object) as FeatureCollection<Geometry, GeoJsonProperties>;
    return collection.features;
  }, [data, objectName]);

  return { features, loading, error };
}
