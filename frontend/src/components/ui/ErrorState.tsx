import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  icon?: React.ReactNode;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ 
  title = "An error occurred", message, onRetry, icon 
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-red-500/5 border border-red-500/20 rounded-xl">
      <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-[#B8322B] mb-4">
        {icon || <AlertCircle className="w-6 h-6" />}
      </div>
      <h3 className="text-lg font-semibold text-[#0B2A33] mb-2">{title}</h3>
      <p className="text-sm text-[#4A6670] max-w-md mb-6">{message}</p>
      
      {onRetry && (
        <button 
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-[#0B7F8E] text-white rounded-lg transition-colors text-sm font-medium"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      )}
    </div>
  );
};
