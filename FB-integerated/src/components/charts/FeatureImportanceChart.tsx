import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';

interface FeatureImportanceChartProps {
  features: { feature: string; importance: number; description?: string }[];
  height?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-800 border border-slate-600 p-3 rounded shadow-lg z-50">
        <p className="text-cyan-400 text-sm font-bold mb-1">{label}</p>
        <p className="text-slate-200 text-sm mb-1">Importance: {(data.importance * 100).toFixed(1)}%</p>
        {data.description && <p className="text-slate-400 text-xs max-w-xs">{data.description}</p>}
      </div>
    );
  }
  return null;
};

export const FeatureImportanceChart: React.FC<FeatureImportanceChartProps> = ({
  features,
  height = 400,
}) => {
  const sortedFeatures = [...features].sort((a, b) => b.importance - a.importance);

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart 
          data={sortedFeatures} 
          layout="vertical" 
          margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
          <XAxis type="number" stroke="#94a3b8" hide />
          <YAxis dataKey="feature" type="category" stroke="#94a3b8" width={100} tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#334155', opacity: 0.4 }} />
          <Bar dataKey="importance" radius={[0, 4, 4, 0]} barSize={20}>
            {sortedFeatures.map((_entry, index) => {
              const opacity = 1 - (index / sortedFeatures.length) * 0.7;
              return <Cell key={`cell-${index}`} fill={`rgba(6, 182, 212, ${opacity})`} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
