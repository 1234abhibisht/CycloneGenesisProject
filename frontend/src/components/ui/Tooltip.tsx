import React from 'react';
import clsx from 'clsx';

interface TooltipProps {
  content: string | React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top' }) => {
  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2"
  };

  return (
    <div className="group relative inline-block">
      {children}
      <div className={clsx(
        "pointer-events-none absolute z-50 opacity-0 transition-opacity group-hover:opacity-100",
        positionClasses[position]
      )}>
        <div className="bg-slate-700 text-slate-100 text-xs py-1.5 px-2.5 rounded-md shadow-lg whitespace-nowrap border border-slate-600">
          {content}
        </div>
      </div>
    </div>
  );
};
