import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-5xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-white/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      <div className={clsx(
        "relative bg-[#E1F4F6] border border-[#CFE5E9] rounded-xl shadow-2xl w-full flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200",
        sizeClasses[size]
      )}>
        <div className="flex items-center justify-between p-4 border-b border-[#CFE5E9]">
          <h2 className="text-lg font-semibold text-[#0B2A33]">{title}</h2>
          <button 
            onClick={onClose}
            className="p-1.5 text-[#4A6670] hover:text-[#0B2A33] hover:bg-[#CFE5E9] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
