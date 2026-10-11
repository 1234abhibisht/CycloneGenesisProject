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
  cyan: 'text-[#0B7F8E] bg-[#0B7F8E]/10 border-[#0B7F8E]',
  amber: 'text-[#A15C07] bg-amber-400/10 border-amber-400',
  red: 'text-[#B8322B] bg-red-400/10 border-red-400',
  emerald: 'text-[#1F7A4D] bg-emerald-400/10 border-emerald-400',
  purple: 'text-[#6D3FC0] bg-purple-400/10 border-purple-400',
};

export const KPICard: React.FC<KPICardProps> = ({
  title, value, unit, icon, trend, trendValue, color = 'cyan', subtitle
}) => {
  return (
    <Card className={clsx("border-l-4", colorMap[color].split(' ')[2])}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-[#4A6670]">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#0B2A33]">{value}</span>
            {unit && <span className="text-sm font-medium text-[#4A6670]">{unit}</span>}
          </div>
          {subtitle && <p className="text-xs text-[#4A6670] mt-1">{subtitle}</p>}
          
          {trend && trendValue && (
            <div className="mt-3 flex items-center gap-1 text-xs">
              {trend === 'up' && <TrendingUp className="w-3 h-3 text-[#B8322B]" />}
              {trend === 'down' && <TrendingDown className="w-3 h-3 text-[#1F7A4D]" />}
              {trend === 'stable' && <Minus className="w-3 h-3 text-[#4A6670]" />}
              <span className={clsx(
                trend === 'up' && "text-[#B8322B]",
                trend === 'down' && "text-[#1F7A4D]",
                trend === 'stable' && "text-[#4A6670]"
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
