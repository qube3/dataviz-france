# Data Viz France

Live at [datavizfr.netlify.app](https://datavizfr.netlify.app/).

Interactive visualizations of French public data — société, économie, éducation,
énergie. React 19 + Vite + TypeScript, deployed as a static site on
Netlify. D3 (`d3-geo`, `d3-color`) is used only as a math library; React owns
the DOM.

## Development

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # type-check + production build to dist/
npm run preview   # serve dist/ at http://localhost:4173
npm run lint
```

## Data pipeline

Generated data lives in `public/data/` and is committed (it's small — tens to
hundreds of KB). Regenerate it locally when INSEE publishes new source data;
Netlify's build only runs `npm run build`, no Python involved.

```bash
python3 -m venv .venv && .venv/bin/pip install -r tools/requirements.txt
npm run data:geo      # downloads + simplifies the departments GeoJSON to TopoJSON
npm run data:prenoms  # aggregates data/raw/prenoms-2025-dpt.csv into public/data/prenoms/prenoms.json
```

Raw source files (`data/raw/`) are gitignored. `data:prenoms` expects the raw
prénoms CSV (from [INSEE](https://www.insee.fr/fr/statistiques/2540004)) at
`data/raw/prenoms-2025-dpt.csv`.

## Architecture

Three layers, in dependency order:

| Layer | Path | Rule |
|---|---|---|
| `viz-kit` | `src/viz-kit/` | Generic, dataset-agnostic building blocks: maps, timelines, legends, palettes. Never imports from `src/viz/`. |
| visualizations | `src/viz/<id>/` | One folder per viz. Owns its data shape and layout; composes viz-kit pieces. |
| site shell | `src/site/`, `src/pages/` | Header, footer, catalog, routing. Discovers visualizations only through `src/viz/registry.ts`. |

## Adding a new visualization

1. Add a data prep step under `tools/` (if needed) that writes static JSON/TopoJSON
   to `public/data/<your-dataset>/`.
2. Create `src/viz/<id>/`, composing pieces from `src/viz-kit/` (`ChoroplethMap`,
   `Timeline`/`useTimelinePlayer`, `CategoricalLegend`, `colorForIndex`, `VizFrame`,
   `useJsonResource`/`useTopology`). Only reach for a new `viz-kit` primitive if
   the piece is genuinely dataset-agnostic — otherwise it belongs in your viz folder.
3. Export a `VizMeta` object (`id`, `title`, `subtitle`, `topic`, `source`, `published`)
   from a `meta.ts`, and a `VizViewProps`-typed root component (`{ mode: 'web' | 'reel' }`).
4. Register it in `src/viz/registry.ts`:
   ```ts
   {
     ...yourVizMeta,
     Component: lazy(() => import('./your-id/YourViz').then((m) => ({ default: m.YourViz }))),
   }
   ```
5. If it should be reel-exportable, call `useReelDriver` (`src/reel/reelDriver.ts`)
   from your root component when `mode === 'reel'`, publishing `frameCount`,
   `labelAt(i)`, and `setFrame(i)`.

Nothing else in the site changes — `HomePage` and `VizPage`/`ReelPage` discover
every visualization through the registry.

## Reel export (vertical video for Reels/TikTok)

```bash
npm run build && npm run preview   # or point --base-url at a deployed Netlify URL
.venv/bin/python tools/make_reel.py --viz prenoms --duration 30
```

Requires `ffmpeg` on PATH (`brew install ffmpeg`). Output goes to `reel/output/`.
`/reel/:vizId` is a bare 1080×1920 stage (no site header/footer) that Playwright
drives via each viz's `window.__reel` contract.

## Deploy

Connect the repo on Netlify (build command `npm run build`, publish directory
`dist`, see `netlify.toml`), or push a first build manually:

```bash
npx netlify deploy --prod
```
