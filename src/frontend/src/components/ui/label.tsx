import React from 'react';
import { cn } from '../../lib/utils';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
}

export const Label: React.FC<LabelProps> = ({ className, children, ...props }) => {
  return (
    <label 
      className={cn(
        "text-sm font-medium text-gray-700 block mb-1",
        className
      )}
      {...props}
    >
      {children}
    </label>
  );
};