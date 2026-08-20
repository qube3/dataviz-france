import { useCallback, useMemo, type ReactNode } from 'react';
import { VizFrame } from '../../viz-kit/layout/VizFrame';
import { Timeline } from '../../viz-kit/timeline/Timeline';
import { useTimelinePlayer } from '../../viz-kit/timeline/useTimelinePlayer';
import { CategoricalLegend } from '../../viz-kit/legend/CategoricalLegend';
import { StackedAreaChart, type StackedAreaSeries } from '../../viz-kit/chart/StackedAreaChart';
import { useReelDriver, type ReelDriver } from '../../reel/reelDriver';
import type { VizViewProps } from '../types';
import { useDoublettesData, type DoubletteItem } from './useDoublettesData';
import { doublettesMeta } from './meta';
import './DoublettesViz.css';

const numberFormat = new Intl.NumberFormat('fr-FR');
const percentFormat = new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: 1 });

interface GenderPanelProps {
  title: string;
  items: DoubletteItem[];
  years: string[];
  currentIndex: number;
  interactive: boolean;
  ariaLabel: string;
}

function GenderPanel({ title, items, years, currentIndex, interactive, ariaLabel }: GenderPanelProps): ReactNode {
  const series = useMemo<StackedAreaSeries[]>(
    () => items.map((item) => ({ id: item.id, label: item.label, color: item.color, values: item.values })),
    [items],
  );

  const renderTooltip = useCallback(
    (index: number) => {
      const total = items.reduce((sum, item) => sum + item.values[index], 0);
      return (
        <div className="doublettes-tooltip">
          <div className="doublettes-tooltip-date">{years[index]}</div>
          {items.map((item) => {
            const value = item.values[index];
            const fraction = total > 0 ? value / total : 0;
            return (
              <div key={item.id} className="doublettes-tooltip-row">
                <span className="doublettes-tooltip-swatch" style={{ backgroundColor: item.color }} />
                <span className="doublettes-tooltip-label">{item.label}</span>
                <span className="doublettes-tooltip-value">
                  {numberFormat.format(value)} ({percentFormat.format(fraction)})
                </span>
              </div>
            );
          })}
        </div>
      );
    },
    [items, years],
  );

  return (
    <section className="doublettes-panel">
      <h2>{title}</h2>
      <div className="doublettes-chart-container">
        <StackedAreaChart
          series={series}
          xLabels={years}
          currentIndex={currentIndex}
          renderTooltip={interactive ? renderTooltip : undefined}
          ariaLabel={ariaLabel}
        />
      </div>
      <div className="doublettes-legend">
        <CategoricalLegend entries={items.map((item) => ({ label: item.label, color: item.color }))} />
      </div>
    </section>
  );
}

export function DoublettesViz({ mode }: VizViewProps): ReactNode {
  const { loading, error, years, frameCount, labelAt, itemsFor } = useDoublettesData();
  const player = useTimelinePlayer({ frameCount, fps: 1 });

  const fillesItems = itemsFor('filles');
  const garconsItems = itemsFor('garcons');

  const ready = !loading && !error && frameCount > 0;
  const driver = useMemo<ReelDriver | null>(
    () => (ready ? { vizId: doublettesMeta.id, ready, frameCount, labelAt, setFrame: player.setFrame } : null),
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
        <div className={`doublettes-charts doublettes-charts--${mode}`}>
          <GenderPanel
            title="👩 Filles"
            items={fillesItems}
            years={years}
            currentIndex={player.frame}
            interactive={mode === 'web'}
            ariaLabel="Répartition des doublettes de spécialités chez les filles de Terminale générale"
          />
          <GenderPanel
            title="👨 Garçons"
            items={garconsItems}
            years={years}
            currentIndex={player.frame}
            interactive={mode === 'web'}
            ariaLabel="Répartition des doublettes de spécialités chez les garçons de Terminale générale"
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
    <VizFrame title={doublettesMeta.title} subtitle={doublettesMeta.subtitle} source={doublettesMeta.source} mode={mode}>
      {content}
    </VizFrame>
  );
}
