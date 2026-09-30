import React from 'react';
import clsx from 'clsx';
import { Database } from 'lucide-react';

interface DataSourceTagProps {
  source: 'IBTrACS' | 'ERA5' | 'NASA GIBS' | 'DEMO' | 'LIVE' | 'MODEL';
  size?: 'sm' | 'md';
}

const sourceColors = {
  'IBTrACS': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  'ERA5': 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  'NASA GIBS': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  'DEMO': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  'LIVE': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  'MODEL': 'bg-slate-700 text-slate-300 border-slate-600',
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
