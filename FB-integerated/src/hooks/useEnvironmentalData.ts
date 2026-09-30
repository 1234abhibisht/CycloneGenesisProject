import { useState, useEffect, useCallback } from 'react';
import { getEnvironmentalSummary } from '../services/environmentalService';

export function useEnvironmentalData(cycloneId?: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariable, setSelectedVariable] = useState<string>('sst');

  const fetchData = useCallback(async () => {
    if (!cycloneId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await getEnvironmentalSummary(cycloneId);
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch environmental data');
    } finally {
      setLoading(false);
    }
  }, [cycloneId]);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  return { 
    data, 
    loading, 
    error, 
    selectedVariable, 
    setSelectedVariable, 
    refresh: fetchData 
  };
}
