import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';

interface RiskDistributionChartProps {
  data: { level: string; count: number }[];
  height?: number;
}

const COLORS: Record<string, string> = {
  HIGH: '#ef4444',
  MODERATE: '#f59e0b',
  LOW: '#22c55e',
  NONE: '#64748b',
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-800 border border-slate-600 p-3 rounded shadow-lg z-50">
        <p style={{ color: COLORS[data.level] || '#fff' }} className="text-sm font-bold">
          {data.level} RISK
        </p>
        <p className="text-slate-300 text-sm">Count: {data.count}</p>
      </div>
    );
  }
  return null;
};

export const RiskDistributionChart: React.FC<RiskDistributionChartProps> = ({
  data,
  height = 300,
}) => {
  const totalCount = data.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div style={{ width: '100%', height, position: 'relative' }}>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10" style={{ top: '-15px' }}>
        <span className="text-3xl font-bold text-slate-200">{totalCount}</span>
        <span className="text-xs text-slate-400">Total Areas</span>
      </div>
      <ResponsiveContainer>
        <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="80%"
            paddingAngle={2}
            dataKey="count"
            nameKey="level"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.level] || '#06b6d4'} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
