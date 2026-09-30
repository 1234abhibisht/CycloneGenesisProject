import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceArea,
  ReferenceLine,
} from 'recharts';

interface IntensityChartProps {
  observedData: { time: string; windSpeed: number }[];
  predictedData?: { time: string; windSpeed: number; errorKt?: number | null }[];
  modelName?: string;
  height?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-600 p-3 rounded shadow-lg z-50">
        <p className="text-slate-300 text-sm mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} style={{ color: entry.color }} className="text-sm font-semibold">
            {entry.name}: {entry.value} kt
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const IntensityChart: React.FC<IntensityChartProps> = ({
  observedData,
  predictedData = [],
  height = 400,
  modelName = 'Model forecast',
}) => {
  // Observed winds, then the model forecast (+6..+24 h). The shaded band is +/- the model's mean absolute
  // error at each lead on the unseen 2007-08 test storms (when provided) - no simulated or random values.
  const combinedData: any[] = observedData.map((d) => ({ ...d }));
  const last = observedData[observedData.length - 1];
  if (last && predictedData.length) {
    const lastRow = combinedData[combinedData.length - 1];
    lastRow.predictedWindSpeed = last.windSpeed;
  }
  predictedData.forEach((pred) => {
    const band = pred.errorKt != null ? [Math.max(0, pred.windSpeed - pred.errorKt), pred.windSpeed + pred.errorKt] : undefined;
    const existing = combinedData.find((d) => d.time === pred.time);
    if (existing) {
      existing.predictedWindSpeed = pred.windSpeed;
      existing.errorBand = band;
    } else {
      combinedData.push({ time: pred.time, windSpeed: null, predictedWindSpeed: pred.windSpeed, errorBand: band });
    }
  });

  combinedData.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <ComposedChart data={combinedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis 
            dataKey="time" 
            stroke="#94a3b8" 
            tickFormatter={(tick) => { const d = new Date(tick); return `${d.getUTCDate()}/${String(d.getUTCHours()).padStart(2, '0')}Z`; }} 
          />
          <YAxis 
            stroke="#94a3b8" 
            label={{ value: 'Wind Speed (kt)', angle: -90, position: 'insideLeft', fill: '#94a3b8', dy: 40 }} 
            domain={[0, 'auto']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          
          {/* IMD Categories Backgrounds */}
          <ReferenceArea y1={17} y2={27} fill="#10b981" fillOpacity={0.05} />
          <ReferenceArea y1={34} y2={47} fill="#fef08a" fillOpacity={0.05} />
          <ReferenceArea y1={64} y2={89} fill="#f97316" fillOpacity={0.05} />
          <ReferenceArea y1={90} y2={119} fill="#ef4444" fillOpacity={0.05} />
          <ReferenceArea y1={120} y2={200} fill="#a855f7" fillOpacity={0.05} />
          
          {/* IMD Categories Lines & Labels */}
          <ReferenceLine y={27} stroke="#10b981" strokeOpacity={0.5} strokeDasharray="3 3" label={{ position: 'insideTopRight', value: 'D', fill: '#10b981', fontSize: 12 }} />
          <ReferenceLine y={47} stroke="#fef08a" strokeOpacity={0.5} strokeDasharray="3 3" label={{ position: 'insideTopRight', value: 'CS', fill: '#fef08a', fontSize: 12 }} />
          <ReferenceLine y={89} stroke="#f97316" strokeOpacity={0.5} strokeDasharray="3 3" label={{ position: 'insideTopRight', value: 'VSCS', fill: '#f97316', fontSize: 12 }} />
          <ReferenceLine y={119} stroke="#ef4444" strokeOpacity={0.5} strokeDasharray="3 3" label={{ position: 'insideTopRight', value: 'ESCS', fill: '#ef4444', fontSize: 12 }} />
          <ReferenceLine y={120} stroke="#a855f7" strokeOpacity={0.5} strokeDasharray="3 3" label={{ position: 'insideTopRight', value: 'SuCS', fill: '#a855f7', fontSize: 12 }} />

          {predictedData.some((p) => p.errorKt != null) && (
            <Area type="monotone" dataKey="errorBand" fill="#f97316" stroke="none" fillOpacity={0.15} name="Test error (± MAE)" />
          )}

          <Line 
            type="monotone" 
            dataKey="windSpeed" 
            name="Observed" 
            stroke="#06b6d4" 
            strokeWidth={2} 
            dot={{ fill: '#06b6d4', r: 4 }} 
            activeDot={{ r: 6 }} 
          />
          {predictedData.length > 0 && (
            <Line type="monotone" dataKey="predictedWindSpeed" name={modelName} stroke="#f97316" strokeWidth={2}
              strokeDasharray="5 5" dot={{ fill: '#f97316', r: 4 }} connectNulls />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
