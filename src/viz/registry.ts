import { lazy } from 'react';
import type { VizDefinition } from './types';
import { prenomsMeta } from './prenoms/meta';
import { prenomsTop5Meta } from './prenoms-top5/meta';
import { prixAlimentairesMeta } from './prix-alimentaires/meta';
import { doublettesMeta } from './doublettes/meta';
import { mixElectriqueMeta } from './mix-electrique/meta';
import { categorieSocioproMeta } from './categorie-sociopro/meta';

export const VIZ: VizDefinition[] = [
  {
    ...prenomsMeta,
    Component: lazy(() => import('./prenoms/PrenomsViz').then((m) => ({ default: m.PrenomsViz }))),
  },
  {
    ...prenomsTop5Meta,
    Component: lazy(() => import('./prenoms-top5/PrenomsTop5Viz').then((m) => ({ default: m.PrenomsTop5Viz }))),
  },
  {
    ...prixAlimentairesMeta,
    Component: lazy(() =>
      import('./prix-alimentaires/PrixAlimentairesViz').then((m) => ({ default: m.PrixAlimentairesViz })),
    ),
  },
  {
    ...doublettesMeta,
    Component: lazy(() => import('./doublettes/DoublettesViz').then((m) => ({ default: m.DoublettesViz }))),
  },
  {
    ...mixElectriqueMeta,
    Component: lazy(() => import('./mix-electrique/MixElectriqueViz').then((m) => ({ default: m.MixElectriqueViz }))),
  },
  {
    ...categorieSocioproMeta,
    Component: lazy(() =>
      import('./categorie-sociopro/CategorieSocioproViz').then((m) => ({ default: m.CategorieSocioproViz })),
    ),
  },
];

export function getViz(id: string): VizDefinition | undefined {
  return VIZ.find((v) => v.id === id);
}
