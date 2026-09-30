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
  ReferenceDot
} from 'recharts';

export interface TrainingMetric {
  epoch: number;
  train_loss: number;
  val_loss: number;
  learning_rate: number;
}

interface Props {
  data?: TrainingMetric[];
  height?: number;
}

const generateFallbackData = (): TrainingMetric[] => {
  const data: TrainingMetric[] = [];
  let tLoss = 1.0;
  let vLoss = 1.1;
  let lr = 0.001;
  
  for (let i = 1; i <= 100; i++) {
    tLoss = tLoss * 0.95 + (Math.random() * 0.02 - 0.01);
    vLoss = vLoss * 0.96 + (Math.random() * 0.03 - 0.01);
    
    // simulate learning rate decay
    if (i % 30 === 0) {
      lr = lr * 0.1;
    }
    
    // add slight overfitting at the end
    if (i > 80) {
      vLoss += 0.005;
    }
    
    data.push({
      epoch: i,
      train_loss: Math.max(0.01, tLoss),
      val_loss: Math.max(0.01, vLoss),
      learning_rate: lr,
    });
  }
  return data;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-600 p-3 rounded shadow-lg z-50">
        <p className="text-slate-200 text-sm mb-2 font-semibold">Epoch {label}</p>
        {payload.map((entry: any, index: number) => {
          const val = entry.dataKey === 'learning_rate' ? entry.value.toExponential(2) : entry.value.toFixed(4);
          return (
            <p key={`item-${index}`} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {val}
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};

export const TrainingMetricsChart: React.FC<Props> = ({ data, height = 400 }) => {
  const chartData = data && data.length > 0 ? data : generateFallbackData();
  
  // Find best epoch
  let bestEpoch = 1;
  let minValLoss = Infinity;
  chartData.forEach(d => {
    if (d.val_loss < minValLoss) {
      minValLoss = d.val_loss;
      bestEpoch = d.epoch;
    }
  });

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
              dataKey="epoch" 
              stroke="#94a3b8"
            />
            <YAxis 
              yAxisId="left"
              stroke="#94a3b8" 
              label={{ value: 'Loss (MSE)', angle: -90, position: 'insideLeft', fill: '#94a3b8', dy: 30 }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="#94a3b8" 
              scale="log"
              domain={['auto', 'auto']}
              label={{ value: 'Learning Rate', angle: 90, position: 'insideRight', fill: '#94a3b8', dy: -30 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            
            <ReferenceDot 
              yAxisId="left" 
              x={bestEpoch} 
              y={minValLoss} 
              r={5} 
              fill="#ef4444" 
              stroke="white" 
              label={{ position: 'top', value: 'Best Model', fill: '#ef4444', fontSize: 12, dy: -10 }} 
            />

            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="train_loss" 
              name="Train Loss" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={false}
            />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="val_loss" 
              name="Val Loss" 
              stroke="#ef4444" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
            <Line 
              yAxisId="right"
              type="stepAfter" 
              dataKey="learning_rate" 
              name="Learning Rate" 
              stroke="#22c55e" 
              strokeWidth={2}
              strokeDasharray="3 3"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
