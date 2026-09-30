import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

export interface SHAPFeature {
  name: string;
  importance: number;
  color?: string;
}

interface Props {
  features?: SHAPFeature[];
  height?: number;
}

const fallbackFeatures: SHAPFeature[] = [
  { name: 'Previous Position History', importance: 28.4 },
  { name: 'Sea Surface Temp', importance: 18.2 },
  { name: 'Vertical Wind Shear', importance: 15.1 },
  { name: 'Central Pressure Deficit', importance: 12.3 },
  { name: 'Forward Storm Motion', importance: 10.1 },
  { name: 'Mid-Level Humidity', importance: 7.8 },
  { name: 'Season/Month', importance: 4.6 },
  { name: 'Distance to Coast', importance: 3.5 },
].sort((a, b) => a.importance - b.importance);

// Gradient color interpolator for low (blue) to high (red)
const getColor = (value: number, max: number) => {
  const ratio = value / max;
  // blue: 59, 130, 246 (#3b82f6)
  // red: 239, 68, 68 (#ef4444)
  const r = Math.round(59 + (239 - 59) * ratio);
  const g = Math.round(130 + (68 - 130) * ratio);
  const b = Math.round(246 + (68 - 246) * ratio);
  return `rgb(${r}, ${g}, ${b})`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-600 p-3 rounded shadow-lg z-50">
        <p className="text-slate-200 text-sm font-semibold mb-1">{label}</p>
        <p className="text-sm text-cyan-400">
          Importance: {payload[0].value.toFixed(1)}%
        </p>
      </div>
    );
  }
  return null;
};

export const SHAPChart: React.FC<Props> = ({ features, height = 400 }) => {
  const chartData = features && features.length > 0 ? [...features].sort((a, b) => a.importance - b.importance) : fallbackFeatures;
  const maxImportance = Math.max(...chartData.map(d => d.importance));

  return (
    <div className="w-full bg-slate-900 rounded-xl p-4 text-white">
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{ top: 10, right: 30, left: 100, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
            <XAxis 
              type="number" 
              stroke="#94a3b8" 
              tickFormatter={(value) => `${value}%`}
              domain={[0, 'auto']}
            />
            <YAxis 
              type="category" 
              dataKey="name" 
              stroke="#94a3b8" 
              width={150}
              tick={{ fontSize: 12, fill: '#cbd5e1' }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1e293b' }} />
            <Bar dataKey="importance" radius={[0, 4, 4, 0]} barSize={20}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || getColor(entry.importance, maxImportance)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
