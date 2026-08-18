import { lazy } from 'react';
import type { VizDefinition } from './types';
import { prenomsMeta } from './prenoms/meta';

export const VIZ: VizDefinition[] = [
  {
    ...prenomsMeta,
    Component: lazy(() => import('./prenoms/PrenomsViz').then((m) => ({ default: m.PrenomsViz }))),
  },
];

export function getViz(id: string): VizDefinition | undefined {
  return VIZ.find((v) => v.id === id);
}
