import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface PressureChartProps {
  observedData: { time: string; pressure: number }[];
  predictedData?: { time: string; pressure: number }[];
  height?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-600 p-3 rounded shadow-lg z-50">
        <p className="text-slate-300 text-sm mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} style={{ color: entry.color }} className="text-sm font-semibold">
            {entry.name}: {entry.value} hPa
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const PressureChart: React.FC<PressureChartProps> = ({
  observedData,
  predictedData = [],
  height = 400,
}) => {
  const combinedData = [...observedData];
  
  predictedData.forEach(pred => {
    const existing = combinedData.find(d => d.time === pred.time);
    if (existing) {
      (existing as any).predictedPressure = pred.pressure;
    } else {
      combinedData.push({ time: pred.time, pressure: null as any, predictedPressure: pred.pressure } as any);
    }
  });

  combinedData.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  // Determine domain for Y-axis
  const allPressures = combinedData.flatMap(d => [d.pressure, (d as any).predictedPressure]).filter(Boolean);
  const minP = Math.min(...allPressures);
  const maxP = Math.max(...allPressures);

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <LineChart data={combinedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis 
            dataKey="time" 
            stroke="#94a3b8" 
            tickFormatter={(tick) => new Date(tick).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
          />
          <YAxis 
            stroke="#94a3b8" 
            label={{ value: 'Pressure (hPa)', angle: -90, position: 'insideLeft', fill: '#94a3b8', dy: 40 }} 
            domain={[Math.floor(minP - 10), Math.ceil(maxP + 10)]}
            reversed={true}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          
          <Line 
            type="monotone" 
            dataKey="pressure" 
            name="Observed" 
            stroke="#06b6d4" 
            strokeWidth={2} 
            dot={{ fill: '#06b6d4', r: 3 }}
            activeDot={{ r: 6 }} 
          />
          {predictedData.length > 0 && (
            <Line 
              type="monotone" 
              dataKey="predictedPressure" 
              name="Predicted" 
              stroke="#f59e0b" 
              strokeWidth={2} 
              strokeDasharray="5 5" 
              dot={{ fill: '#f59e0b', r: 3 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
