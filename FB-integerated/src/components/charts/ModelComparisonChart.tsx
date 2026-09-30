import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export interface ModelMetric {
  horizon: string;
  xgboost_mae: number;
  lstm_mae: number;
  rf_mae: number;
  ensemble_mae: number;
  xgboost_rmse: number;
  lstm_rmse: number;
  rf_rmse: number;
  ensemble_rmse: number;
}

interface Props {
  data?: ModelMetric[];
  height?: number;
}

const fallbackData: ModelMetric[] = [
  {
    horizon: '+24h',
    xgboost_mae: 3.96,
    lstm_mae: 4.12,
    rf_mae: 4.85,
    ensemble_mae: 3.75,
    xgboost_rmse: 5.2,
    lstm_rmse: 5.8,
    rf_rmse: 6.3,
    ensemble_rmse: 5.0
  },
  {
    horizon: '+48h',
    xgboost_mae: 6.85,
    lstm_mae: 6.15,
    rf_mae: 7.90,
    ensemble_mae: 5.95,
    xgboost_rmse: 8.5,
    lstm_rmse: 7.8,
    rf_rmse: 9.6,
    ensemble_rmse: 7.5
  },
  {
    horizon: '+72h',
    xgboost_mae: 10.25,
    lstm_mae: 8.90,
    rf_mae: 12.40,
    ensemble_mae: 8.50,
    xgboost_rmse: 12.6,
    lstm_rmse: 11.2,
    rf_rmse: 14.8,
    ensemble_rmse: 10.9
  }
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-600 p-3 rounded shadow-lg z-50">
        <p className="text-slate-200 text-sm mb-2 font-semibold">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {entry.value} kt
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const ModelComparisonChart: React.FC<Props> = ({ data, height = 400 }) => {
  const chartData = data && data.length > 0 ? data : fallbackData;

  return (
    <div className="w-full bg-slate-900 rounded-xl p-4 text-white">
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="horizon" stroke="#94a3b8" />
            <YAxis 
              stroke="#94a3b8" 
              label={{ value: 'MAE (kt)', angle: -90, position: 'insideLeft', fill: '#94a3b8', dy: 30 }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1e293b' }} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar dataKey="xgboost_mae" name="XGBoost" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="lstm_mae" name="LSTM" fill="#a855f7" radius={[4, 4, 0, 0]} />
            <Bar dataKey="rf_mae" name="Random Forest" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="ensemble_mae" name="Ensemble" fill="#f97316" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
