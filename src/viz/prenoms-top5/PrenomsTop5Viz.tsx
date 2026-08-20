import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { VizFrame } from '../../viz-kit/layout/VizFrame';
import { Timeline } from '../../viz-kit/timeline/Timeline';
import { useTimelinePlayer } from '../../viz-kit/timeline/useTimelinePlayer';
import { CategoricalLegend } from '../../viz-kit/legend/CategoricalLegend';
import { LineChart, type LineChartSeries } from '../../viz-kit/chart/LineChart';
import { evenYearTicks } from '../../viz-kit/chart/ticks';
import { useReelDriver, type ReelDriver } from '../../reel/reelDriver';
import type { VizViewProps } from '../types';
import { usePrenomsTop5Data, rollingTop5, type Top5Item, type RankMode } from './usePrenomsTop5Data';
import { prenomsTop5Meta } from './meta';
import './PrenomsTop5Viz.css';

const numberFormat = new Intl.NumberFormat('fr-FR');

interface GenderPanelProps {
  title: string;
  items: Top5Item[];
  years: string[];
  xTickIndices: number[];
  currentIndex: number;
  scaleType: 'linear' | 'log';
  interactive: boolean;
  ariaLabel: string;
}

function GenderPanel({
  title,
  items,
  years,
  xTickIndices,
  currentIndex,
  scaleType,
  interactive,
  ariaLabel,
}: GenderPanelProps): ReactNode {
  const series = useMemo<LineChartSeries[]>(
    () =>
      items.map((item) => ({
        id: item.id,
        color: item.color,
        points: scaleType === 'log' ? item.values.map((v) => (v > 0 ? v : null)) : item.values,
      })),
    [items, scaleType],
  );

  const renderTooltip = useCallback(
    (index: number) => (
      <div className="top5-tooltip">
        <div className="top5-tooltip-date">{years[index]}</div>
        {items.map((item) => (
          <div key={item.id} className="top5-tooltip-row">
            <span className="top5-tooltip-swatch" style={{ backgroundColor: item.color }} />
            <span className="top5-tooltip-label">{item.label}</span>
            <span className="top5-tooltip-value">{numberFormat.format(item.values[index])}</span>
          </div>
        ))}
      </div>
    ),
    [items, years],
  );

  return (
    <section className="top5-panel">
      <h2>{title}</h2>
      <div className="top5-chart-container">
        <LineChart
          series={series}
          xLabels={years}
          xTickIndices={xTickIndices}
          currentIndex={currentIndex}
          scaleType={scaleType}
          yFormat={(v) => numberFormat.format(Math.round(v))}
          renderTooltip={interactive ? renderTooltip : undefined}
          ariaLabel={ariaLabel}
        />
      </div>
      <div className="top5-legend">
        <CategoricalLegend entries={items.map((item) => ({ label: item.label, color: item.color }))} />
      </div>
    </section>
  );
}

export function PrenomsTop5Viz({ mode }: VizViewProps): ReactNode {
  const { loading, error, years, frameCount, labelAt, candidatesFor } = usePrenomsTop5Data();
  const player = useTimelinePlayer({ frameCount, fps: 8 });
  const [scaleType, setScaleType] = useState<'linear' | 'log'>('linear');
  const [rankMode, setRankMode] = useState<RankMode>('all-time');

  const femaleCandidates = candidatesFor('2', 0);
  const maleCandidates = candidatesFor('1', 6);
  const femaleItems = useMemo(
    () => (rankMode === 'rolling' ? rollingTop5(femaleCandidates, player.frame) : femaleCandidates.slice(0, 5)),
    [femaleCandidates, rankMode, player.frame],
  );
  const maleItems = useMemo(
    () => (rankMode === 'rolling' ? rollingTop5(maleCandidates, player.frame) : maleCandidates.slice(0, 5)),
    [maleCandidates, rankMode, player.frame],
  );
  const xTickIndices = useMemo(() => evenYearTicks(years), [years]);

  const ready = !loading && !error && frameCount > 0;
  const driver = useMemo<ReelDriver | null>(
    () => (ready ? { vizId: prenomsTop5Meta.id, ready, frameCount, labelAt, setFrame: player.setFrame } : null),
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
        <div className="top5-toggles">
          <label className="scale-toggle">
            <input
              type="checkbox"
              checked={scaleType === 'log'}
              onChange={(e) => setScaleType(e.target.checked ? 'log' : 'linear')}
            />
            Échelle logarithmique
          </label>

          <label className="scale-toggle">
            <input
              type="checkbox"
              checked={rankMode === 'rolling'}
              onChange={(e) => setRankMode(e.target.checked ? 'rolling' : 'all-time')}
            />
            Top 5 glissant (fenêtre de 5 ans), plutôt que le top 5 de tous les temps
          </label>
        </div>

        <div className={`top5-charts top5-charts--${mode}`}>
          <GenderPanel
            title="👩 Prénoms féminins"
            items={femaleItems}
            years={years}
            xTickIndices={xTickIndices}
            currentIndex={player.frame}
            scaleType={scaleType}
            interactive={mode === 'web'}
            ariaLabel="Nombre de naissances par an pour les 5 prénoms féminins les plus donnés depuis 1900"
          />
          <GenderPanel
            title="👨 Prénoms masculins"
            items={maleItems}
            years={years}
            xTickIndices={xTickIndices}
            currentIndex={player.frame}
            scaleType={scaleType}
            interactive={mode === 'web'}
            ariaLabel="Nombre de naissances par an pour les 5 prénoms masculins les plus donnés depuis 1900"
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
    <VizFrame title={prenomsTop5Meta.title} subtitle={prenomsTop5Meta.subtitle} source={prenomsTop5Meta.source} mode={mode}>
      {content}
    </VizFrame>
  );
}
