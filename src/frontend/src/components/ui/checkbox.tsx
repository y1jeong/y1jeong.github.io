import React from 'react';
import { cn } from '../../lib/utils';
import { Check } from 'lucide-react';

interface CheckboxProps {
  id?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
}

export const Checkbox: React.FC<CheckboxProps> = ({ 
  id, 
  checked = false, 
  onCheckedChange, 
  className,
  disabled = false
}) => {
  return (
    <div className="relative">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        className="sr-only"
        disabled={disabled}
      />
      <div 
        className={cn(
          "flex h-4 w-4 items-center justify-center rounded border border-gray-300",
          checked ? "bg-blue-600 border-blue-600" : "bg-white",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
          className
        )}
        onClick={() => !disabled && onCheckedChange?.(!checked)}
      >
        {checked && (
          <Check className="h-3 w-3 text-white" />
        )}
      </div>
    </div>
  );
};