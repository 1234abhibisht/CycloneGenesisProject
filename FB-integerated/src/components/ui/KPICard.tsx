import React from 'react';
import clsx from 'clsx';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from './Card';

interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  color?: 'cyan' | 'amber' | 'red' | 'emerald' | 'purple';
  subtitle?: string;
}

const colorMap = {
  cyan: 'text-cyan-400 bg-cyan-400/10 border-cyan-400',
  amber: 'text-amber-400 bg-amber-400/10 border-amber-400',
  red: 'text-red-400 bg-red-400/10 border-red-400',
  emerald: 'text-emerald-400 bg-emerald-400/10 border-emerald-400',
  purple: 'text-purple-400 bg-purple-400/10 border-purple-400',
};

export const KPICard: React.FC<KPICardProps> = ({
  title, value, unit, icon, trend, trendValue, color = 'cyan', subtitle
}) => {
  return (
    <Card className={clsx("border-l-4", colorMap[color].split(' ')[2])}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-100">{value}</span>
            {unit && <span className="text-sm font-medium text-slate-400">{unit}</span>}
          </div>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
          
          {trend && trendValue && (
            <div className="mt-3 flex items-center gap-1 text-xs">
              {trend === 'up' && <TrendingUp className="w-3 h-3 text-red-400" />}
              {trend === 'down' && <TrendingDown className="w-3 h-3 text-emerald-400" />}
              {trend === 'stable' && <Minus className="w-3 h-3 text-slate-400" />}
              <span className={clsx(
                trend === 'up' && "text-red-400",
                trend === 'down' && "text-emerald-400",
                trend === 'stable' && "text-slate-400"
              )}>
                {trendValue}
              </span>
            </div>
          )}
        </div>
        <div className={clsx("p-3 rounded-lg", colorMap[color].split(' ').slice(0, 2).join(' '))}>
          {icon}
        </div>
      </div>
    </Card>
  );
};
