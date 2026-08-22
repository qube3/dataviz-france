import { useCallback, useMemo, type ReactNode } from 'react';
import { VizFrame } from '../../viz-kit/layout/VizFrame';
import { Timeline } from '../../viz-kit/timeline/Timeline';
import { useTimelinePlayer } from '../../viz-kit/timeline/useTimelinePlayer';
import { CategoricalLegend } from '../../viz-kit/legend/CategoricalLegend';
import { StackedAreaChart, type StackedAreaSeries } from '../../viz-kit/chart/StackedAreaChart';
import { useReelDriver, type ReelDriver } from '../../reel/reelDriver';
import type { VizViewProps } from '../types';
import { useCategorieSocioproData } from './useCategorieSocioproData';
import { categorieSocioproMeta } from './meta';
import './CategorieSocioproViz.css';

const percentFormat = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });

export function CategorieSocioproViz({ mode }: VizViewProps): ReactNode {
  const { loading, error, years, frameCount, labelAt, series: sourceSeries } = useCategorieSocioproData();
  const player = useTimelinePlayer({ frameCount, fps: 1 });

  const series = useMemo<StackedAreaSeries[]>(
    () => sourceSeries.map((s) => ({ id: s.id, label: s.label, color: s.color, values: s.values })),
    [sourceSeries],
  );

  const renderTooltip = useCallback(
    (index: number) => (
      <div className="categoriesociopro-tooltip">
        <div className="categoriesociopro-tooltip-date">{years[index]}</div>
        {sourceSeries.map((s) => (
          <div key={s.id} className="categoriesociopro-tooltip-row">
            <span className="categoriesociopro-tooltip-swatch" style={{ backgroundColor: s.color }} />
            <span className="categoriesociopro-tooltip-label">{s.label}</span>
            <span className="categoriesociopro-tooltip-value">{percentFormat.format(s.values[index])} %</span>
          </div>
        ))}
      </div>
    ),
    [sourceSeries, years],
  );

  const ready = !loading && !error && frameCount > 0;
  const driver = useMemo<ReelDriver | null>(
    () => (ready ? { vizId: categorieSocioproMeta.id, ready, frameCount, labelAt, setFrame: player.setFrame } : null),
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
        <div className="categoriesociopro-chart-container">
          <StackedAreaChart
            series={series}
            xLabels={years}
            currentIndex={player.frame}
            renderTooltip={mode === 'web' ? renderTooltip : undefined}
            ariaLabel="Part de chaque catégorie socioprofessionnelle parmi la population active, de 1982 à 2022"
          />
        </div>

        <div className="categoriesociopro-legend">
          <CategoricalLegend entries={sourceSeries.map((s) => ({ label: s.label, color: s.color }))} />
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
      title={categorieSocioproMeta.title}
      subtitle={categorieSocioproMeta.subtitle}
      source={categorieSocioproMeta.source}
      mode={mode}
    >
      {content}
    </VizFrame>
  );
}
