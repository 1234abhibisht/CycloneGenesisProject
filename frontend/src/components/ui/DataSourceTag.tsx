import React from 'react';
import clsx from 'clsx';
import { Database } from 'lucide-react';

interface DataSourceTagProps {
  source: 'IBTrACS' | 'ERA5' | 'NASA GIBS' | 'DEMO' | 'LIVE' | 'MODEL';
  size?: 'sm' | 'md';
}

const sourceColors = {
  'IBTrACS': 'bg-[#0B7F8E]/10 text-[#0B7F8E] border-[#0B7F8E]/30',
  'ERA5': 'bg-purple-500/10 text-[#6D3FC0] border-purple-500/30',
  'NASA GIBS': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  'DEMO': 'bg-amber-500/10 text-[#A15C07] border-amber-500/30',
  'LIVE': 'bg-emerald-500/10 text-[#1F7A4D] border-emerald-500/30',
  'MODEL': 'bg-[#CFE5E9] text-[#4A6670] border-[#CFE5E9]',
};

export const DataSourceTag: React.FC<DataSourceTagProps> = ({ source, size = 'sm' }) => {
  return (
    <span className={clsx(
      "inline-flex items-center gap-1.5 rounded border font-medium",
      sourceColors[source],
      size === 'sm' ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-1"
    )}>
      <Database className={size === 'sm' ? "w-2.5 h-2.5" : "w-3 h-3"} />
      {source}
    </span>
  );
};
