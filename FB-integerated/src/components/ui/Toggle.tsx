import React from 'react';
import clsx from 'clsx';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  size?: 'sm' | 'md';
}

export const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label, size = 'md' }) => {
  const isSmall = size === 'sm';
  
  return (
    <label className="flex items-center cursor-pointer gap-3">
      <div className="relative">
        <input 
          type="checkbox" 
          className="sr-only" 
          checked={checked} 
          onChange={(e) => onChange(e.target.checked)} 
        />
        <div className={clsx(
          "block rounded-full transition-colors",
          isSmall ? "w-8 h-4.5" : "w-10 h-6",
          checked ? "bg-cyan-500" : "bg-slate-700"
        )}></div>
        <div className={clsx(
          "absolute bg-white rounded-full transition-transform",
          isSmall ? "w-3.5 h-3.5 top-0.5 left-0.5" : "w-4 h-4 top-1 left-1",
          checked && (isSmall ? "translate-x-3.5" : "translate-x-4")
        )}></div>
      </div>
      <div className={clsx("text-slate-300 font-medium", isSmall ? "text-xs" : "text-sm")}>
        {label}
      </div>
    </label>
  );
};
