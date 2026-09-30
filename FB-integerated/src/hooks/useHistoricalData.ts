import { useState, useEffect, useCallback } from 'react';
import { getHistoricalCyclones, searchCyclones, getSimilarCyclones } from '../services/historicalService';
import type { CycloneSummary } from '../services/historicalService';

export function useHistoricalData() {
  const [cyclones, setCyclones] = useState<CycloneSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<any>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = searchQuery
        ? await searchCyclones(searchQuery)
        : await getHistoricalCyclones(filters);
      setCyclones(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch historical data');
    } finally {
      setLoading(false);
    }
  }, [filters, searchQuery]);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  return { 
    cyclones, 
    loading, 
    error, 
    filters, 
    setFilters, 
    searchQuery, 
    setSearchQuery,
    page,
    setPage,
    getSimilarCyclones,
    refresh: fetchData 
  };
}
