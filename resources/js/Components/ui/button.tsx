import * as React from 'react';

type ButtonVariant = 'default' | 'outline' | 'destructive' | 'ghost' | 'link' | 'secondary';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  default: 'bg-red-600 hover:bg-red-700 text-white',
  outline: 'border border-red-200 text-red-800 hover:bg-red-50',
  destructive: 'bg-red-700 hover:bg-red-800 text-white',
  ghost: 'text-red-800 hover:bg-red-50',
  link: 'text-red-700 hover:text-red-800 underline-offset-2 hover:underline',
  secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:text-gray-100',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
  icon: 'h-10 w-10',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'md', asChild = false, children, ...props }, ref) => {
    const classes = `inline-flex items-center justify-center rounded-lg font-medium transition ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
    
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, { 
        className: `${classes} ${(children.props as any).className || ''}`,
        ...props,
      } as any);
    }
    
    return (
      <button
        ref={ref}
        className={classes}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export default Button;


