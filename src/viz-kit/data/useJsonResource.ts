import { useEffect, useState } from 'react';

export interface JsonResourceState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

const cache = new Map<string, Promise<unknown>>();

function fetchJson<T>(url: string): Promise<T> {
  let promise = cache.get(url) as Promise<T> | undefined;
  if (!promise) {
    promise = fetch(url).then((res) => {
      if (!res.ok) throw new Error(`${url}: ${res.status} ${res.statusText}`);
      return res.json() as Promise<T>;
    });
    cache.set(url, promise);
    promise.catch(() => cache.delete(url));
  }
  return promise;
}

/** Fetches and caches a static JSON resource, shared across every caller of the same URL. */
export function useJsonResource<T>(url: string): JsonResourceState<T> {
  const [state, setState] = useState<JsonResourceState<T>>({ data: null, loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    setState({ data: null, loading: true, error: null });

    fetchJson<T>(url)
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((error: Error) => {
        if (!cancelled) setState({ data: null, loading: false, error });
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  return state;
}
