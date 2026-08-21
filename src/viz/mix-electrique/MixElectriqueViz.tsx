import { useCallback, useMemo, type ReactNode } from 'react';
import { VizFrame } from '../../viz-kit/layout/VizFrame';
import { Timeline } from '../../viz-kit/timeline/Timeline';
import { useTimelinePlayer } from '../../viz-kit/timeline/useTimelinePlayer';
import { CategoricalLegend } from '../../viz-kit/legend/CategoricalLegend';
import { StackedAreaChart, type StackedAreaSeries } from '../../viz-kit/chart/StackedAreaChart';
import { useReelDriver, type ReelDriver } from '../../reel/reelDriver';
import type { VizViewProps } from '../types';
import { useMixElectriqueData } from './useMixElectriqueData';
import { mixElectriqueMeta } from './meta';
import './MixElectriqueViz.css';

const twhFormat = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
const percentFormat = new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: 1 });

export function MixElectriqueViz({ mode }: VizViewProps): ReactNode {
  const { loading, error, years, frameCount, labelAt, series: sourceSeries } = useMixElectriqueData();
  const player = useTimelinePlayer({ frameCount, fps: 1 });

  const series = useMemo<StackedAreaSeries[]>(
    () => sourceSeries.map((s) => ({ id: s.id, label: s.label, color: s.color, values: s.values })),
    [sourceSeries],
  );

  const renderTooltip = useCallback(
    (index: number) => {
      const total = sourceSeries.reduce((sum, s) => sum + s.values[index], 0);
      return (
        <div className="mixelectrique-tooltip">
          <div className="mixelectrique-tooltip-date">{years[index]}</div>
          {sourceSeries.map((s) => {
            const value = s.values[index];
            const fraction = total > 0 ? value / total : 0;
            return (
              <div key={s.id} className="mixelectrique-tooltip-row">
                <span className="mixelectrique-tooltip-swatch" style={{ backgroundColor: s.color }} />
                <span className="mixelectrique-tooltip-label">{s.label}</span>
                <span className="mixelectrique-tooltip-value">
                  {twhFormat.format(value)} TWh ({percentFormat.format(fraction)})
                </span>
              </div>
            );
          })}
        </div>
      );
    },
    [sourceSeries, years],
  );

  const ready = !loading && !error && frameCount > 0;
  const driver = useMemo<ReelDriver | null>(
    () => (ready ? { vizId: mixElectriqueMeta.id, ready, frameCount, labelAt, setFrame: player.setFrame } : null),
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
        <div className="mixelectrique-chart-container">
          <StackedAreaChart
            series={series}
            xLabels={years}
            currentIndex={player.frame}
            renderTooltip={mode === 'web' ? renderTooltip : undefined}
            ariaLabel="Part de chaque filière dans la production nationale d'électricité, de 2012 à 2025"
          />
        </div>

        <div className="mixelectrique-legend">
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
      title={mixElectriqueMeta.title}
      subtitle={mixElectriqueMeta.subtitle}
      source={mixElectriqueMeta.source}
      mode={mode}
    >
      {content}
    </VizFrame>
  );
}
