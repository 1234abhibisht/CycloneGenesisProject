import React from 'react';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';

interface SelectProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({ options, value, onChange, label, className }) => {
  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      {label && <label className="text-xs font-medium text-[#4A6670]">{label}</label>}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-[#E1F4F6] border border-[#CFE5E9] text-[#0B2A33] rounded-lg pl-3 pr-9 py-2 text-sm focus:outline-none focus:border-[#0B7F8E] focus:ring-1 focus:ring-cyan-500 transition-colors"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A6670] pointer-events-none" />
      </div>
    </div>
  );
};
