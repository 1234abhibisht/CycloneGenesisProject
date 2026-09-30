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

interface WindRoseChartProps {
  data: { direction: string; speed: number; frequency: number }[];
  height?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-800 border border-slate-600 p-3 rounded shadow-lg z-50">
        <p className="text-slate-200 text-sm font-bold mb-1">Direction: {label}</p>
        <p className="text-cyan-400 text-sm">Frequency: {data.frequency}%</p>
        <p className="text-amber-400 text-sm">Avg Speed: {data.speed} kt</p>
      </div>
    );
  }
  return null;
};

export const WindRoseChart: React.FC<WindRoseChartProps> = ({
  data,
  height = 300,
}) => {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis dataKey="direction" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" label={{ value: 'Frequency (%)', angle: -90, position: 'insideLeft', fill: '#94a3b8', dy: 40 }} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#334155', opacity: 0.4 }} />
          <Bar dataKey="frequency" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => {
              const opacity = Math.min(1, Math.max(0.3, entry.speed / 100));
              return <Cell key={`cell-${index}`} fill={`rgba(6, 182, 212, ${opacity})`} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
