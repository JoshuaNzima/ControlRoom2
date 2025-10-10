import * as React from 'react';

type ButtonVariant = 'default' | 'outline' | 'destructive' | 'ghost' | 'link';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  default: 'bg-red-600 hover:bg-red-700 text-white',
  outline: 'border border-red-200 text-red-800 hover:bg-red-50',
  destructive: 'bg-red-700 hover:bg-red-800 text-white',
  ghost: 'text-red-800 hover:bg-red-50',
  link: 'text-red-700 hover:text-red-800 underline-offset-2 hover:underline',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center rounded-lg font-medium transition ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export default Button;


