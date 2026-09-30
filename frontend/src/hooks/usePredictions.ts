import { useState, useEffect, useCallback } from 'react';
import { getPrediction } from '../services/predictionService';
import type { PredictionResult } from '../types/prediction';

export function usePredictions(cycloneId: string = 'DEMO_CYCLONE') {
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedHorizon, setSelectedHorizon] = useState<number>(24);

  const fetchPrediction = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPrediction(cycloneId);
      setPrediction(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch predictions');
    } finally {
      setLoading(false);
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
