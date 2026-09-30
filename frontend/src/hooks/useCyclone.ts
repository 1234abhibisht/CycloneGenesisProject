import { useState, useEffect, useCallback, useRef } from 'react';
import type { ActiveCyclone, OperationalStandbyState } from '../types/cyclone';
import { fetchActiveCycloneData } from '../services/cycloneService';

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
  const requestInFlight = useRef(false);
  const hasCompletedFirstLoad = useRef(false);
  const refreshQueued = useRef(false);

  const fetchCyclone = useCallback(async () => {
    if (requestInFlight.current) { refreshQueued.current = true; return; }
    requestInFlight.current = true;

    try {
      if (!hasCompletedFirstLoad.current) setLoading(true);
      setError(null);

      const res = await fetchActiveCycloneData();
      // A network timeout is not an operational update. Replacing a verified
      // storm with standby made maps and panels jump on every failed poll.
      if (res.active === false && res.unavailable && hasCompletedFirstLoad.current) {
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
      setError(err instanceof Error ? err.message : 'Failed to query operational data');
    } finally {
      hasCompletedFirstLoad.current = true;
      requestInFlight.current = false;
      setLoading(false);
      if (refreshQueued.current) {
        refreshQueued.current = false;
        window.dispatchEvent(new Event('cyclone-refresh'));
      }
    }
  }, []);

  useEffect(() => {
    fetchCyclone();
    // Refresh is deliberately operator-triggered. Intermittent providers
    // should never make the command display change by themselves.
  }, [fetchCyclone]);

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
