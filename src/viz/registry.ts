import { lazy } from 'react';
import type { VizDefinition } from './types';
import { prenomsMeta } from './prenoms/meta';
import { prixAlimentairesMeta } from './prix-alimentaires/meta';

export const VIZ: VizDefinition[] = [
  {
    ...prenomsMeta,
    Component: lazy(() => import('./prenoms/PrenomsViz').then((m) => ({ default: m.PrenomsViz }))),
  },
  {
    ...prixAlimentairesMeta,
    Component: lazy(() =>
      import('./prix-alimentaires/PrixAlimentairesViz').then((m) => ({ default: m.PrixAlimentairesViz })),
    ),
  },
];

export function getViz(id: string): VizDefinition | undefined {
  return VIZ.find((v) => v.id === id);
}
