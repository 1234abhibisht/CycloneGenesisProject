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
    <div className={clsx("bg-[#E1F4F6]/50 border border-[#CFE5E9]/50 rounded-xl flex flex-col overflow-hidden", className)}>
      {(title || icon || headerAction) && (
        <div className="flex items-center justify-between p-4 border-b border-[#CFE5E9]/50">
          <div className="flex items-center gap-3">
            {icon && <div className="text-[#0B7F8E]">{icon}</div>}
            <div>
              {title && <h3 className="font-semibold text-[#0B2A33]">{title}</h3>}
              {subtitle && <p className="text-xs text-[#4A6670] mt-0.5">{subtitle}</p>}
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
