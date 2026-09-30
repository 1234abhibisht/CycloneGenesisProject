import { useState, useEffect, useCallback, useRef } from 'react';
import type { OperationalStorm } from '../types/operational';
import type { ActiveCyclone } from '../types/cyclone';
import { fetchActiveStorms, operationalStormToActiveCyclone } from '../services/operationalService';
import { getActiveCyclone } from '../services/cycloneService';
import { USE_OPERATIONAL } from '../services/api';

const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export function useOperationalData() {
  const [storms, setStorms] = useState<OperationalStorm[]>([]);
  const [selectedStormId, setSelectedStormId] = useState<string | null>(null);
  const [activeCyclone, setActiveCyclone] = useState<ActiveCyclone | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [lastFetched, setLastFetched] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!USE_OPERATIONAL) {
        // Skip operational, go straight to mock
        const mockData = await getActiveCyclone();
        setActiveCyclone(mockData);
        setIsLive(false);
        setStorms([]);
        setLastFetched(new Date().toISOString());
        return;
      }

      // Try fetching live data from GDACS
      const liveStorms = await fetchActiveStorms();

      if (liveStorms.length > 0) {
        setStorms(liveStorms);
        setIsLive(true);
        setLastFetched(new Date().toISOString());

        // Select the first storm if none selected, or keep current selection
        const targetId = selectedStormId && liveStorms.find(s => s.id === selectedStormId)
          ? selectedStormId
          : liveStorms[0].id;

        setSelectedStormId(targetId);

        const selectedStorm = liveStorms.find(s => s.id === targetId)!;
        const cyclone = operationalStormToActiveCyclone(selectedStorm);
        setActiveCyclone(cyclone);
      } else {
        // No active storms globally — fall back to demo
        console.info('[Operational] No active tropical cyclones. Using demo data.');
        const mockData = await getActiveCyclone();
        setActiveCyclone(mockData);
        setIsLive(false);
        setStorms([]);
        setLastFetched(new Date().toISOString());
      }
    } catch (err) {
      console.warn('[Operational] GDACS fetch failed, falling back to demo:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch operational data');

      // Fall back to mock data
      try {
        const mockData = await getActiveCyclone();
        setActiveCyclone(mockData);
      } catch {
        // Even mock failed
      }
      setIsLive(false);
      setLastFetched(new Date().toISOString());
    } finally {
      setLoading(false);
    }
  }, [selectedStormId]);

  // Select a different storm
  const selectStorm = useCallback((stormId: string) => {
    setSelectedStormId(stormId);
    const storm = storms.find(s => s.id === stormId);
    if (storm) {
      const cyclone = operationalStormToActiveCyclone(storm);
      setActiveCyclone(cyclone);
    }
  }, [storms]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh interval for live data
  useEffect(() => {
    if (isLive) {
      intervalRef.current = setInterval(fetchData, REFRESH_INTERVAL_MS);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isLive, fetchData]);

  return {
    storms,
    selectedStormId,
    selectStorm,
    activeCyclone,
    isLive,
    lastFetched,
    error,
    loading,
    refresh: fetchData,
  };
}
