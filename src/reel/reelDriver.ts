import { useEffect } from 'react';

/** The contract a viz exposes to the Playwright reel recorder while mounted under /reel/:vizId. */
export interface ReelDriver {
  vizId: string;
  ready: boolean;
  frameCount: number;
  labelAt: (i: number) => string;
  setFrame: (i: number) => void;
}

declare global {
  interface Window {
    __reel?: ReelDriver;
  }
}

/** Publishes (and cleans up) a viz's ReelDriver on window.__reel. Pass null while not ready or not in reel mode. */
export function useReelDriver(driver: ReelDriver | null): void {
  useEffect(() => {
    if (!driver) return;
    window.__reel = driver;
    return () => {
      if (window.__reel === driver) delete window.__reel;
    };
  }, [driver]);
}
