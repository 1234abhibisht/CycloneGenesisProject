import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine
} from 'recharts';

export interface NASADataPoint {
  time: string;
  sst: number;
  precipitation: number;
  cloudTemp: number;
}

interface Props {
  data?: NASADataPoint[];
  height?: number;
}

// Generate fallback mock data
const generateFallbackData = (): NASADataPoint[] => {
  const data: NASADataPoint[] = [];
  const now = new Date();
  for (let i = 24; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 3600 * 1000);
    data.push({
      time: d.toISOString(),
      sst: 25.5 + Math.random() * 2.5 + (i < 12 ? 1 : -0.5),
      precipitation: Math.max(0, Math.random() * 15 - 5 + (i < 12 ? 10 : 0)),
      cloudTemp: -40 - Math.random() * 30,
    });
  }
  return data;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-600 p-3 rounded shadow-lg z-50">
        <p className="text-slate-200 text-sm mb-2 font-semibold">
          {new Date(label).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
        {payload.map((entry: any, index: number) => {
          let unit = '';
          if (entry.dataKey === 'sst') unit = '°C';
          if (entry.dataKey === 'precipitation') unit = 'mm/h';
          if (entry.dataKey === 'cloudTemp') unit = '°C';
          
          return (
            <p key={`item-${index}`} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value.toFixed(1)} {unit}
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};

export const NASADataChart: React.FC<Props> = ({ data, height = 400 }) => {
  const chartData = data && data.length > 0 ? data : generateFallbackData();

  return (
    <div className="w-full bg-slate-900 rounded-xl p-4 text-white">
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis 
              dataKey="time" 
              stroke="#94a3b8"
              tickFormatter={(tick) => new Date(tick).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            />
            <YAxis 
              yAxisId="left"
              stroke="#94a3b8" 
              domain={[20, 35]}
              label={{ value: 'SST / Cloud Temp (°C)', angle: -90, position: 'insideLeft', fill: '#94a3b8', dy: 50 }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="#94a3b8" 
              domain={[0, 40]}
              label={{ value: 'Precipitation (mm/h)', angle: 90, position: 'insideRight', fill: '#94a3b8', dy: -40 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            
            <ReferenceArea yAxisId="left" y1={26.5} fill="#ef4444" fillOpacity={0.1} />
            <ReferenceLine yAxisId="left" y={26.5} stroke="#ef4444" strokeOpacity={0.5} strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Cyclogenesis Threshold (26.5°C)', fill: '#ef4444', fontSize: 12 }} />

            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="sst" 
              name="Sea Surface Temp" 
              stroke="#ef4444" 
              strokeWidth={2}
              dot={false}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="precipitation" 
              name="Precipitation" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={false}
            />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="cloudTemp" 
              name="Cloud Top Temp" 
              stroke="#06b6d4" 
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
