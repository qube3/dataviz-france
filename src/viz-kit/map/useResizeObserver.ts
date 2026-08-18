import { useEffect, useRef, useState, type RefObject } from 'react';

export interface Size {
  width: number;
  height: number;
}

/** Tracks an element's content-box size via ResizeObserver. */
export function useResizeObserver<T extends Element>(): [RefObject<T | null>, Size] {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, size];
}
