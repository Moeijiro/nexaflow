"use client";

import { useEffect, useRef, useState } from "react";

interface AsyncState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload: () => void;
  setData: (value: T) => void;
}

/**
 * Minimal data fetching for the dashboard — no cache library needed here.
 *
 * The fetcher lives in a ref and the effect re-runs on `key`, a string that
 * describes what is being fetched ("workflow:4", "executions:0:failed"). That
 * keeps the dependency list a literal array, which React's lint rules require,
 * and makes the refetch condition explicit at the call site.
 *
 * `loading` starts true and is only flipped from a promise callback or from
 * `reload()`, so the effect never sets state synchronously.
 */
export function useAsync<T>(fn: () => Promise<T>, key: string = ""): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  const fetcher = useRef(fn);

  // Keep the ref pointing at the latest closure without writing during render.
  useEffect(() => {
    fetcher.current = fn;
  });

  useEffect(() => {
    let cancelled = false;
    fetcher
      .current()
      .then((value) => {
        if (cancelled) return;
        setData(value);
        setError(null);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [key, nonce]);

  const reload = () => {
    setLoading(true);
    setNonce((value) => value + 1);
  };

  return { data, error, loading, reload, setData };
}
