import { useState, useEffect, useCallback, useRef } from 'react';
import type { ActiveCyclone, OperationalStandbyState } from '../types/cyclone';
import { fetchActiveCycloneData } from '../services/cycloneService';
import { LIVE_OBSERVATION_MAX_AGE_MS } from '../services/observationFreshness';

export function useCyclone() {
  const [cyclone, setCyclone] = useState<ActiveCyclone | null>(null);
  const [standby, setStandby] = useState<OperationalStandbyState | null>(null);
  const [hasActiveCyclone, setHasActiveCyclone] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('INIT');
  // Polling must never replace a populated dashboard with a loader. It also
  // prevents duplicate requests in development where effects are replayed.
  const requestVersion = useRef(0);
  const hasCompletedFirstLoad = useRef(false);

  const fetchCyclone = useCallback(async () => {
    const version = ++requestVersion.current;

    try {
      if (!hasCompletedFirstLoad.current) setLoading(true);
      setError(null);

      const res = await fetchActiveCycloneData();
      if (version !== requestVersion.current) return;
      // Failed verification must clear any live or replay state from a previous request.
      if (res.active === false && res.unavailable) {
        setError('Observation service unavailable.');
        setCyclone(null); setStandby(null); setHasActiveCyclone(false); setStatus('OFFLINE');
        return;
      }

      if (res.active && res.data.length > 0) {
        setCyclone(res.data[0]);
        setStandby(null);
        setHasActiveCyclone(true);
        setStatus(res.status);
      } else {
        setCyclone(null);
        setStandby(res.active === false ? res.standby : null);
        setHasActiveCyclone(false);
        setStatus('NO_ACTIVE_CYCLONE');
      }
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      if (version === requestVersion.current) {
        setError(err instanceof Error ? err.message : 'Failed to query observation data');
        setCyclone(null); setStandby(null); setHasActiveCyclone(false); setStatus('OFFLINE');
      }
    } finally {
      if (version === requestVersion.current) { hasCompletedFirstLoad.current = true; setLoading(false); }
    }
  }, []);

  useEffect(() => {
    fetchCyclone();
    const timer = window.setInterval(fetchCyclone, 5 * 60 * 1000);
    const onVisible = () => { if (document.visibilityState === 'visible') fetchCyclone(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      ++requestVersion.current;
    };
  }, [fetchCyclone]);

  useEffect(() => {
    if (status !== 'LIVE' || !cyclone) return;
    const expiry = Date.parse(cyclone.currentPosition.timestamp) + LIVE_OBSERVATION_MAX_AGE_MS;
    const timer = window.setTimeout(() => {
      setCyclone(null); setStandby(null); setHasActiveCyclone(false); setStatus('OFFLINE');
      setError('Observation expired. Checking the current feed.');
      fetchCyclone();
    }, Math.max(0, expiry - Date.now()));
    return () => window.clearTimeout(timer);
  }, [cyclone, status, fetchCyclone]);

  useEffect(() => {
    window.addEventListener('cyclone-refresh', fetchCyclone);
    return () => window.removeEventListener('cyclone-refresh', fetchCyclone);
  }, [fetchCyclone]);

  return { 
    cyclone, 
    standby, 
    hasActiveCyclone, 
    status, 
    loading, 
    error, 
    lastUpdated, 
    refresh: fetchCyclone 
  };
}
