import React from 'react';
import { fmtDateIST, fmtTime } from '../../utils/dataAge';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface EnvironmentalChartProps {
  data: { timestamp: string; value: number }[];
  variable: string;
  unit: string;
  height?: number;
  color?: string;
}

const CustomTooltip = ({ active, payload, label, variable, unit }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#E1F4F6] border border-[#CFE5E9] p-3 rounded shadow-lg z-50">
        <p className="text-[#4A6670] text-sm mb-1">{fmtTime(new Date(label).toISOString(), { year: true })}</p>
        <p style={{ color: payload[0].color }} className="text-sm font-semibold">
          {variable}: {payload[0].value} {unit}
        </p>
      </div>
    );
  }
  return null;
};

export const EnvironmentalChart: React.FC<EnvironmentalChartProps> = ({
  data,
  variable,
  unit,
  height = 300,
  color = '#06b6d4',
}) => {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`colorValue-${variable.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis 
            dataKey="timestamp" 
            stroke="#4A6670" 
            tickFormatter={(tick) => fmtDateIST(new Date(tick).toISOString(), { year: false })} 
          />
          <YAxis stroke="#4A6670" />
          <Tooltip content={<CustomTooltip variable={variable} unit={unit} />} />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            fillOpacity={1} 
            fill={`url(#colorValue-${variable.replace(/\s+/g, '')})`} 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
