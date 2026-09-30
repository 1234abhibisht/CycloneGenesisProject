import React from 'react';

interface SliderProps {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  marks?: { value: number; label: string }[];
  label?: string;
}

export const Slider: React.FC<SliderProps> = ({ min, max, step, value, onChange, marks, label }) => {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="w-full">
      {label && <div className="text-sm font-medium text-slate-300 mb-3">{label}</div>}
      <div className="relative pt-1 pb-6">
        <div className="h-1.5 bg-slate-700 rounded-full w-full">
          <div 
            className="absolute h-1.5 bg-cyan-500 rounded-full" 
            style={{ width: `${percentage}%` }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute top-1 w-full h-1.5 opacity-0 cursor-pointer"
        />
        <div 
          className="absolute top-0 -mt-1 w-4 h-4 bg-cyan-400 rounded-full border-2 border-gray-900 shadow shadow-cyan-500/50 pointer-events-none"
          style={{ left: `calc(${percentage}% - 8px)` }}
        />
        
        {marks && (
          <div className="absolute top-4 w-full flex justify-between text-[10px] text-slate-400 font-medium">
            {marks.map((mark) => (
              <div 
                key={mark.value} 
                className="absolute transform -translate-x-1/2 mt-1"
                style={{ left: `${((mark.value - min) / (max - min)) * 100}%` }}
              >
                {mark.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
