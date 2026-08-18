import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { VizFrame } from '../../viz-kit/layout/VizFrame';
import { Timeline } from '../../viz-kit/timeline/Timeline';
import { useTimelinePlayer } from '../../viz-kit/timeline/useTimelinePlayer';
import { CategoricalLegend } from '../../viz-kit/legend/CategoricalLegend';
import { LineChart, type LineChartSeries } from '../../viz-kit/chart/LineChart';
import { normalizeToFirst } from '../../viz-kit/chart/normalize';
import { useReelDriver, type ReelDriver } from '../../reel/reelDriver';
import type { VizViewProps } from '../types';
import { usePrixData } from './usePrixData';
import { prixAlimentairesMeta } from './meta';
import './PrixAlimentairesViz.css';

export function PrixAlimentairesViz({ mode }: VizViewProps): ReactNode {
  const { loading, error, months, frameCount, labelAt, items } = usePrixData();
  const player = useTimelinePlayer({ frameCount, fps: 15 });
  const [normalized, setNormalized] = useState(true);

  const series = useMemo<LineChartSeries[]>(
    () =>
      items.map((item) => ({
        id: item.id,
        color: item.color,
        points: normalized ? normalizeToFirst(item.values) : item.values,
      })),
    [items, normalized],
  );

  const markerFor = useCallback((id: string) => items.find((item) => item.id === id)?.emoji, [items]);

  const yFormat = useCallback(
    (v: number) => (normalized ? `×${v.toFixed(2)}` : `${v.toFixed(2)} €`),
    [normalized],
  );

  const renderTooltip = useCallback(
    (index: number) => (
      <div className="prix-tooltip">
        <div className="prix-tooltip-date">{labelAt(index)}</div>
        {items.map((item, i) => {
          const value = series[i].points[index];
          return (
            <div key={item.id} className="prix-tooltip-row">
              <span className="prix-tooltip-swatch" style={{ backgroundColor: item.color }} />
              <span className="prix-tooltip-label">
                {item.emoji} {item.label}
              </span>
              <span className="prix-tooltip-value">{value === null ? '—' : yFormat(value)}</span>
            </div>
          );
        })}
      </div>
    ),
    [items, series, labelAt, yFormat],
  );

  const ready = !loading && !error && frameCount > 0;
  const driver = useMemo<ReelDriver | null>(
    () => (ready ? { vizId: prixAlimentairesMeta.id, ready, frameCount, labelAt, setFrame: player.setFrame } : null),
    [ready, frameCount, labelAt, player.setFrame],
  );
  useReelDriver(mode === 'reel' ? driver : null);

  let content: ReactNode;
  if (error) {
    content = <p className="viz-status">Erreur de chargement des données.</p>;
  } else if (!ready) {
    content = <p className="viz-status">Chargement…</p>;
  } else {
    content = (
      <>
        <label className="normalize-toggle">
          <input type="checkbox" checked={normalized} onChange={(e) => setNormalized(e.target.checked)} />
          Normaliser les prix (base 1 en {labelAt(0)})
        </label>

        <div className="prix-chart-container">
          <LineChart
            series={series}
            xLabels={months}
            currentIndex={player.frame}
            yFormat={yFormat}
            markerFor={markerFor}
            renderTooltip={mode === 'web' ? renderTooltip : undefined}
            ariaLabel="Évolution du prix de 5 produits alimentaires depuis 1998"
          />
        </div>

        <div className="prix-legend">
          <CategoricalLegend
            entries={items.map((item) => ({ label: `${item.emoji} ${item.label}`, color: item.color }))}
          />
        </div>

        <Timeline
          frame={player.frame}
          frameCount={frameCount}
          isPlaying={player.isPlaying}
          onToggle={player.toggle}
          onSeek={player.seek}
          labelAt={labelAt}
        />
      </>
    );
  }

  return (
    <VizFrame
      title={prixAlimentairesMeta.title}
      subtitle={prixAlimentairesMeta.subtitle}
      source={prixAlimentairesMeta.source}
      mode={mode}
    >
      {content}
    </VizFrame>
  );
}
