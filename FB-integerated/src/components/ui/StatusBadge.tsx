import React from 'react';
import clsx from 'clsx';

interface StatusBadgeProps {
  status: 'live' | 'demo' | 'high' | 'moderate' | 'low' | 'none' | 'active' | 'dissipated' | 'intensifying' | 'weakening' | 'stable';
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
}

const statusConfig = {
  live: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30', dot: 'bg-emerald-500' },
  demo: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30', dot: 'bg-amber-500' },
  high: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', dot: 'bg-red-500' },
  moderate: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30', dot: 'bg-amber-500' },
  low: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30', dot: 'bg-emerald-500' },
  none: { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30', dot: 'bg-slate-500' },
  active: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30', dot: 'bg-cyan-500' },
  dissipated: { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30', dot: 'bg-slate-500' },
  intensifying: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', dot: 'bg-red-500' },
  weakening: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30', dot: 'bg-emerald-500' },
  stable: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30', dot: 'bg-amber-500' },
};

const sizeConfig = {
  sm: 'text-[10px] px-2 py-0.5 gap-1.5',
  md: 'text-xs px-2.5 py-1 gap-2',
  lg: 'text-sm px-3 py-1.5 gap-2.5',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', pulse = false }) => {
  const config = statusConfig[status];
  
  return (
    <span className={clsx(
      "inline-flex items-center font-medium rounded-full border",
      config.bg, config.text, config.border, sizeConfig[size]
    )}>
      {config.dot && (
        <span className="relative flex h-1.5 w-1.5">
          {pulse && <span className={clsx("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", config.dot)}></span>}
          <span className={clsx("relative inline-flex rounded-full h-1.5 w-1.5", config.dot)}></span>
        </span>
      )}
      {status.toUpperCase()}
    </span>
  );
};
