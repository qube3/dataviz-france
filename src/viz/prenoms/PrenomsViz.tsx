import { useMemo, type ReactNode } from 'react';
import { VizFrame } from '../../viz-kit/layout/VizFrame';
import { Timeline } from '../../viz-kit/timeline/Timeline';
import { useTimelinePlayer } from '../../viz-kit/timeline/useTimelinePlayer';
import { useReelDriver, type ReelDriver } from '../../reel/reelDriver';
import type { VizViewProps } from '../types';
import { usePrenomsData } from './usePrenomsData';
import { PrenomsMapPanel } from './PrenomsMapPanel';
import { prenomsMeta } from './meta';
import './PrenomsViz.css';

export function PrenomsViz({ mode }: VizViewProps): ReactNode {
  const { loading, error, features, frameCount, labelAt, frameFor } = usePrenomsData();
  const player = useTimelinePlayer({ frameCount });

  const male = useMemo(() => frameFor(1, player.frame), [frameFor, player.frame]);
  const female = useMemo(() => frameFor(2, player.frame), [frameFor, player.frame]);

  const ready = !loading && !error && frameCount > 0 && features.length > 0;
  const driver = useMemo<ReelDriver | null>(
    () => (ready ? { vizId: prenomsMeta.id, ready, frameCount, labelAt, setFrame: player.setFrame } : null),
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
        <div className={`prenoms-panels prenoms-panels--${mode}`}>
          <PrenomsMapPanel
            title="👨 Prénoms masculins"
            features={features}
            colorFor={male.colorFor}
            tooltipFor={male.tooltipFor}
            legendEntries={male.legendEntries}
            ariaLabel="Carte du prénom masculin le plus donné par département"
          />
          <PrenomsMapPanel
            title="👩 Prénoms féminins"
            features={features}
            colorFor={female.colorFor}
            tooltipFor={female.tooltipFor}
            legendEntries={female.legendEntries}
            ariaLabel="Carte du prénom féminin le plus donné par département"
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
    <VizFrame title={prenomsMeta.title} subtitle={prenomsMeta.subtitle} source={prenomsMeta.source} mode={mode}>
      {content}
    </VizFrame>
  );
}
