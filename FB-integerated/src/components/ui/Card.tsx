import React from 'react';
import clsx from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  headerAction?: React.ReactNode;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  children, className, title, subtitle, icon, headerAction, noPadding = false 
}) => {
  return (
    <div className={clsx("bg-slate-800/50 border border-slate-700/50 rounded-xl flex flex-col overflow-hidden", className)}>
      {(title || icon || headerAction) && (
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            {icon && <div className="text-cyan-400">{icon}</div>}
            <div>
              {title && <h3 className="font-semibold text-slate-100">{title}</h3>}
              {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className={clsx("flex-1", !noPadding && "p-4")}>
        {children}
      </div>
    </div>
  );
};
