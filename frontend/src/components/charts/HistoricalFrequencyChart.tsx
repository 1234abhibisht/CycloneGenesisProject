import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface HistoricalFrequencyChartProps {
  data: { label: string; count: number; basin?: string }[];
  type: 'yearly' | 'monthly' | 'decadal';
  height?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#E1F4F6] border border-[#CFE5E9] p-3 rounded shadow-lg z-50">
        <p className="text-[#0B2A33] text-sm font-bold mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const HistoricalFrequencyChart: React.FC<HistoricalFrequencyChartProps> = ({
  data,
  type: _type,
  height = 300,
}) => {
  const groupedData = data.reduce((acc: any, curr: any) => {
    const existing = acc.find((item: any) => item.label === curr.label);
    if (existing) {
      if (curr.basin === 'BB') existing.BB = curr.count;
      else if (curr.basin === 'AS') existing.AS = curr.count;
      else existing.Count = curr.count;
    } else {
      const newItem: any = { label: curr.label };
      if (curr.basin === 'BB') newItem.BB = curr.count;
      else if (curr.basin === 'AS') newItem.AS = curr.count;
      else newItem.Count = curr.count;
      acc.push(newItem);
    }
    return acc;
  }, []);

  const hasBasins = groupedData.length > 0 && ('BB' in groupedData[0] || 'AS' in groupedData[0]);

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart data={groupedData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis dataKey="label" stroke="#4A6670" />
          <YAxis stroke="#4A6670" allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#334155', opacity: 0.4 }} />
          {hasBasins && <Legend wrapperStyle={{ paddingTop: '20px' }} />}
          
          {hasBasins ? (
            <>
              <Bar dataKey="BB" name="Bay of Bengal" stackId="a" fill="#06b6d4" />
              <Bar dataKey="AS" name="Arabian Sea" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </>
          ) : (
            <Bar dataKey="Count" name="Cyclones" fill="#06b6d4" radius={[4, 4, 0, 0]} />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
