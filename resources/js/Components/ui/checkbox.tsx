import React from 'react';
import IconMapper from '@/Components/IconMapper';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ checked = false, onCheckedChange, className = '', ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onCheckedChange?.(e.target.checked);
    };

    return (
      <div className="relative inline-flex items-center">
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          onChange={handleChange}
          className={`peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground ${className}`}
          {...props}
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {checked && (
                <IconMapper name="check" className="h-3 w-3 text-primary-foreground" />
          )}
        </div>
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';
