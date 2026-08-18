import { useCallback, useEffect, useRef, useState } from 'react';

export interface TimelinePlayerOptions {
  frameCount: number;
  /** Frames per second. Defaults to one step every 1.2s, matching the original cadence. */
  fps?: number;
  loop?: boolean;
}

export interface TimelinePlayer {
  frame: number;
  isPlaying: boolean;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (frame: number) => void;
  setFrame: (frame: number) => void;
}

const DEFAULT_FPS = 1000 / 500;
const MAX_STEPS_PER_TICK = 5;

export function useTimelinePlayer({
  frameCount,
  fps = DEFAULT_FPS,
  loop = true,
}: TimelinePlayerOptions): TimelinePlayer {
  const [frame, setFrameState] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const frameRef = useRef(frame);
  frameRef.current = frame;
  const rafRef = useRef<number | null>(null);
  const accumulatorRef = useRef(0);
  const lastTsRef = useRef<number | null>(null);
  const stepMs = 1000 / fps;

  const setFrame = useCallback(
    (f: number) => {
      setFrameState(Math.min(Math.max(f, 0), Math.max(frameCount - 1, 0)));
    },
    [frameCount],
  );

  const pause = useCallback(() => setIsPlaying(false), []);

  // Dragging the slider and a running animation must not fight over the
  // frame: seeking always stops playback first.
  const seek = useCallback(
    (f: number) => {
      pause();
      setFrame(f);
    },
    [pause, setFrame],
  );

  const play = useCallback(() => {
    if (frameCount > 1) setIsPlaying(true);
  }, [frameCount]);

  const toggle = useCallback(() => (isPlaying ? pause() : play()), [isPlaying, pause, play]);

  useEffect(() => {
    if (!isPlaying) {
      lastTsRef.current = null;
      accumulatorRef.current = 0;
      return;
    }

    const tick = (ts: number) => {
      if (lastTsRef.current === null) lastTsRef.current = ts;
      accumulatorRef.current += ts - lastTsRef.current;
      lastTsRef.current = ts;

      let steps = 0;
      while (accumulatorRef.current >= stepMs && steps < MAX_STEPS_PER_TICK) {
        accumulatorRef.current -= stepMs;
        steps += 1;
        const next = frameRef.current + 1;
        if (next >= frameCount) {
          if (loop) {
            frameRef.current = 0;
          } else {
            frameRef.current = frameCount - 1;
            setFrameState(frameRef.current);
            setIsPlaying(false);
            return;
          }
        } else {
          frameRef.current = next;
        }
      }
      setFrameState(frameRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, stepMs, frameCount, loop]);

  // A backgrounded tab throttles requestAnimationFrame; pause explicitly so
  // the UI reflects reality instead of silently stalling.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) pause();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [pause]);

  return { frame, isPlaying, play, pause, toggle, seek, setFrame };
}
