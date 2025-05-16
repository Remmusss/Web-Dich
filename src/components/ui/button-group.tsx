'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonGroupProps {
  children: React.ReactNode;
  spacing?: number;
  mb?: number;
  mt?: number;
  className?: string;
}

export function ButtonGroup({ 
  children, 
  spacing = 2,
  mb = 0,
  mt = 0,
  className 
}: ButtonGroupProps) {
  const spacingClass = `space-x-${spacing}`;
  const marginClasses = `${mb ? `mb-${mb}` : ''} ${mt ? `mt-${mt}` : ''}`;

  return (
    <div className={cn(
      'flex flex-wrap items-center', 
      spacingClass, 
      marginClasses,
      className
    )}>
      {children}
    </div>
  );
}

export default ButtonGroup; 