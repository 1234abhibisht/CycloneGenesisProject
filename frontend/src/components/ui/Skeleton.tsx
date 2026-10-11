import React from 'react';
import clsx from 'clsx';
import { Card } from './Card';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string;
  height?: string;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className, variant = 'text', width, height, count = 1 
}) => {
  const baseClasses = "animate-pulse bg-[#CFE5E9]/50";
  
  const variantClasses = {
    text: "rounded h-4 w-full",
    rectangular: "rounded-lg",
    circular: "rounded-full"
  };

  const elements = Array.from({ length: count }).map((_, i) => (
    <div 
      key={i} 
      className={clsx(
        baseClasses, 
        variantClasses[variant],
        variant === 'text' && count > 1 && i === count - 1 ? "w-2/3" : "",
        className
      )}
      style={{ width, height }}
    />
  ));

  if (count === 1) return elements[0];
  return <div className="space-y-2">{elements}</div>;
};

export const SkeletonCard = () => (
  <Card>
    <Skeleton className="mb-4 w-1/3" />
    <Skeleton count={3} />
  </Card>
);

export const SkeletonChart = () => (
  <Card>
    <Skeleton className="mb-6 w-1/4" />
    <Skeleton variant="rectangular" className="w-full h-48" />
  </Card>
);
