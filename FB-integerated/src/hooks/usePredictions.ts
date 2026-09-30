import { useState, useEffect, useCallback, useRef } from 'react';
import { getPrediction } from '../services/predictionService';
import type { PredictionResult } from '../types/prediction';

export function usePredictions(cycloneId: string = 'DEMO_CYCLONE') {
  const requestVersion = useRef(0);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedHorizon, setSelectedHorizon] = useState<number>(24);

  const fetchPrediction = useCallback(async () => {
    const version = ++requestVersion.current;
    try {
      setLoading(true);
      setError(null);
      setPrediction(null);
      const data = await getPrediction(cycloneId);
      if (version === requestVersion.current) setPrediction(data);
    } catch (err) {
      if (version === requestVersion.current) setError(err instanceof Error ? err.message : 'Failed to fetch predictions');
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, [cycloneId]);

  useEffect(() => { 
    fetchPrediction(); 
  }, [fetchPrediction]);

  useEffect(() => {
    window.addEventListener('cyclone-refresh', fetchPrediction);
    return () => window.removeEventListener('cyclone-refresh', fetchPrediction);
  }, [fetchPrediction]);

  return { 
    prediction, 
    loading, 
    error, 
    selectedHorizon, 
    setSelectedHorizon, 
    refresh: fetchPrediction 
  };
}
