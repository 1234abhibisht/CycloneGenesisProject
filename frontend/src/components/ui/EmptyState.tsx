import React from 'react';

interface EmptyStateProps {
  title: string;
  message: string;
  icon?: React.ReactNode;
  action?: { label: string; onClick: () => void };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, message, icon, action }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center h-full min-h-[300px]">
      {icon && (
        <div className="w-16 h-16 bg-[#E1F4F6] rounded-full flex items-center justify-center text-[#4A6670] mb-6">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-[#0B2A33] mb-2">{title}</h3>
      <p className="text-sm text-[#4A6670] max-w-sm mb-6">{message}</p>
      
      {action && (
        <button 
          onClick={action.onClick}
          className="px-4 py-2 bg-[#CFE5E9] hover:bg-[#A9CDD4] text-[#0B2A33] rounded-lg transition-colors text-sm font-medium"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
