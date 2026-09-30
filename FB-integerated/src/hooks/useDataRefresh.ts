import { useState, useEffect, useCallback } from 'react';

export function useDataRefresh(fetchFn: () => Promise<void>, intervalMs: number = 30 * 60 * 1000) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isStale, setIsStale] = useState(false);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchFn();
      setLastRefresh(new Date());
      setIsStale(false);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsStale(true);
      refresh();
    }, intervalMs);
    return () => clearInterval(interval);
  }, [intervalMs, refresh]);

  return { isStale, lastRefresh, refresh, isRefreshing };
}
