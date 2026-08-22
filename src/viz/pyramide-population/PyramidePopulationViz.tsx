import { useCallback, useMemo, type ReactNode } from 'react';
import { VizFrame } from '../../viz-kit/layout/VizFrame';
import { Timeline } from '../../viz-kit/timeline/Timeline';
import { useTimelinePlayer } from '../../viz-kit/timeline/useTimelinePlayer';
import { CategoricalLegend } from '../../viz-kit/legend/CategoricalLegend';
import { PopulationPyramidChart, type PyramidBin } from '../../viz-kit/chart/PopulationPyramidChart';
import { useReelDriver, type ReelDriver } from '../../reel/reelDriver';
import type { VizViewProps } from '../types';
import { usePyramideData } from './usePyramideData';
import { pyramidePopulationMeta } from './meta';
import './PyramidePopulationViz.css';

// The site's own accent colors (see theme.css): persian blue and grapefruit
// pink, reused here for men/women rather than a fresh pair.
const MEN_COLOR = '#0a2dd3';
const WOMEN_COLOR = '#ff6b6c';
// Darker shades of the same two colors (d3.color(...).darker(1.5)), used to
// highlight the surplus at ages where one sex outnumbers the other - most
// visibly women in old age, where longevity differs.
const MEN_SURPLUS_COLOR = '#061a7c';
const WOMEN_SURPLUS_COLOR = '#953f3f';

const popFormat = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

export function PyramidePopulationViz({ mode }: VizViewProps): ReactNode {
  const { loading, error, years, ages, men, women, frameCount, labelAt, maxValue } = usePyramideData();
  const player = useTimelinePlayer({ frameCount, fps: 1 });

  const currentYear = Number(years[player.frame]);

  const bins = useMemo<PyramidBin[]>(() => {
    const menRow = men[player.frame] ?? [];
    const womenRow = women[player.frame] ?? [];
    return ages.map((age, i) => ({
      id: String(age),
      leftValue: menRow[i] ?? 0,
      rightValue: womenRow[i] ?? 0,
      primaryLabel: String(age),
      secondaryLabel: String(currentYear - age),
    }));
  }, [ages, men, women, player.frame, currentYear]);

  const renderTooltip = useCallback(
    (index: number) => {
      const bin = bins[index];
      const surplus = bin.leftValue - bin.rightValue;
      return (
        <div className="pyramidepopulation-tooltip">
          <div className="pyramidepopulation-tooltip-title">
            {bin.primaryLabel} ans (nés en {bin.secondaryLabel})
          </div>
          <div className="pyramidepopulation-tooltip-row">
            <span className="pyramidepopulation-tooltip-swatch" style={{ backgroundColor: MEN_COLOR }} />
            <span>Hommes</span>
            <span className="pyramidepopulation-tooltip-value">{popFormat.format(bin.leftValue)}</span>
          </div>
          <div className="pyramidepopulation-tooltip-row">
            <span className="pyramidepopulation-tooltip-swatch" style={{ backgroundColor: WOMEN_COLOR }} />
            <span>Femmes</span>
            <span className="pyramidepopulation-tooltip-value">{popFormat.format(bin.rightValue)}</span>
          </div>
          {surplus !== 0 && (
            <div className="pyramidepopulation-tooltip-surplus">
              {surplus > 0 ? 'Hommes' : 'Femmes'} en excédent : {popFormat.format(Math.abs(surplus))}
            </div>
          )}
        </div>
      );
    },
    [bins],
  );

  const ready = !loading && !error && frameCount > 0;
  const driver = useMemo<ReelDriver | null>(
    () =>
      ready ? { vizId: pyramidePopulationMeta.id, ready, frameCount, labelAt, setFrame: player.setFrame } : null,
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
        <div className="pyramidepopulation-chart-container">
          <PopulationPyramidChart
            bins={bins}
            leftColor={MEN_COLOR}
            rightColor={WOMEN_COLOR}
            leftSurplusColor={MEN_SURPLUS_COLOR}
            rightSurplusColor={WOMEN_SURPLUS_COLOR}
            maxValue={maxValue}
            renderTooltip={mode === 'web' ? renderTooltip : undefined}
            ariaLabel={`Pyramide des âges de la France en ${currentYear}, hommes et femmes par âge`}
          />
        </div>

        <div className="pyramidepopulation-legend">
          <CategoricalLegend entries={[{ label: 'Hommes', color: MEN_COLOR }, { label: 'Femmes', color: WOMEN_COLOR }]} />
          <p className="pyramidepopulation-surplus-note">
            Teinte foncée : excédent par rapport à l'autre sexe, au même âge (ex. plus de femmes que d'hommes aux âges
            élevés, du fait d'une espérance de vie plus longue).
          </p>
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
      title={pyramidePopulationMeta.title}
      subtitle={pyramidePopulationMeta.subtitle}
      source={pyramidePopulationMeta.source}
      mode={mode}
    >
      {content}
    </VizFrame>
  );
}
