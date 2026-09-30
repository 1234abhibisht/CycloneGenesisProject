import React from 'react';
import clsx from 'clsx';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange }) => {
  return (
    <div className="border-b border-[#CFE5E9]">
      <nav className="flex space-x-6 overflow-x-auto" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={clsx(
                "whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors",
                isActive
                  ? "border-[#0B7F8E] text-[#0B7F8E]"
                  : "border-transparent text-[#4A6670] hover:text-[#4A6670] hover:border-[#CFE5E9]"
              )}
            >
              {tab.icon && <span className={clsx("w-4 h-4", isActive ? "text-[#0B7F8E]" : "text-[#4A6670]")}>{tab.icon}</span>}
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
