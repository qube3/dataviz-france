import type { ReactNode } from 'react';
import './Timeline.css';

export interface TimelineProps {
  frame: number;
  frameCount: number;
  isPlaying: boolean;
  onToggle: () => void;
  onSeek: (frame: number) => void;
  labelAt: (frame: number) => string;
  speedOptions?: number[];
  speed?: number;
  onSpeedChange?: (speed: number) => void;
}

export function Timeline({
  frame,
  frameCount,
  isPlaying,
  onToggle,
  onSeek,
  labelAt,
  speedOptions,
  speed,
  onSpeedChange,
}: TimelineProps): ReactNode {
  const maxFrame = Math.max(frameCount - 1, 0);

  return (
    <div className="viz-timeline">
      <div className="year-display">
        <span className="year-value">{labelAt(frame)}</span>
      </div>

      <div className="timeline-row">
        <button
          type="button"
          className="play-pause-btn"
          aria-label={isPlaying ? 'Pause' : 'Lecture'}
          title={isPlaying ? 'Pause' : 'Lecture'}
          onClick={onToggle}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        <div className="timeline-slider">
          <input
            type="range"
            className="slider"
            min={0}
            max={maxFrame}
            value={frame}
            onChange={(e) => onSeek(Number(e.target.value))}
          />
          <div className="slider-labels">
            <span>{labelAt(0)}</span>
            <span>{labelAt(maxFrame)}</span>
          </div>
        </div>
      </div>

      {speedOptions && onSpeedChange && (
        <div className="speed-control">
          <label htmlFor="timeline-speed">Vitesse</label>
          <select
            id="timeline-speed"
            value={speed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
          >
            {speedOptions.map((option) => (
              <option key={option} value={option}>
                {option}×
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
