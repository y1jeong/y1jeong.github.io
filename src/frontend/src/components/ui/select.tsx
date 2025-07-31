import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { ChevronDown } from 'lucide-react';

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({ value, onValueChange, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            value,
            onValueChange,
            isOpen,
            setIsOpen
          });
        }
        return child;
      })}
    </div>
  );
};

interface SelectTriggerProps {
  className?: string;
  children: React.ReactNode;
  value?: string;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
}

export const SelectTrigger: React.FC<SelectTriggerProps> = ({ 
  className, 
  children, 
  isOpen, 
  setIsOpen 
}) => {
  return (
    <button
      type="button"
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      onClick={() => setIsOpen?.(!isOpen)}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  );
};

interface SelectValueProps {
  placeholder?: string;
  value?: string;
}

export const SelectValue: React.FC<SelectValueProps> = ({ placeholder, value }) => {
  return (
    <span className={cn(
      value ? "text-gray-900" : "text-gray-400"
    )}>
      {value || placeholder}
    </span>
  );
};

interface SelectContentProps {
  className?: string;
  children: React.ReactNode;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
  onValueChange?: (value: string) => void;
}

export const SelectContent: React.FC<SelectContentProps> = ({ 
  className, 
  children, 
  isOpen, 
  setIsOpen, 
  onValueChange 
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-40" 
        onClick={() => setIsOpen?.(false)}
      />
      <div className={cn(
        "absolute top-full left-0 z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto",
        className
      )}>
        {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<any>, {
              onValueChange,
              setIsOpen
            });
          }
          return child;
        })}
      </div>
    </>
  );
};

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  onValueChange?: (value: string) => void;
  setIsOpen?: (open: boolean) => void;
}

export const SelectItem: React.FC<SelectItemProps> = ({ 
  value, 
  children, 
  onValueChange, 
  setIsOpen 
}) => {
  const handleClick = () => {
    onValueChange?.(value);
    setIsOpen?.(false);
  };

  return (
    <div
      className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 focus:bg-gray-100"
      onClick={handleClick}
    >
      {children}
    </div>
  );
};