import * as React from 'react';

type ButtonVariant = 'default' | 'outline' | 'destructive' | 'ghost' | 'link' | 'secondary';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  default: 'bg-coin-700 hover:bg-coin-600 text-white shadow-sm shadow-black/10 dark:shadow-black/40',
  outline: 'border border-coin-200 text-coin-800 hover:bg-coin-50 dark:border-gray-800 dark:text-gray-100 dark:hover:bg-gray-900',
  destructive: 'bg-red-700 hover:bg-red-600 text-white shadow-sm shadow-black/10 dark:shadow-black/40',
  ghost: 'text-coin-800 hover:bg-coin-50 dark:text-gray-100 dark:hover:bg-gray-900',
  link: 'text-coin-700 hover:text-coin-800 underline-offset-2 hover:underline dark:text-coin-300 dark:hover:text-coin-200',
  secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-900 dark:hover:bg-gray-800 dark:text-gray-100',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
  icon: 'h-10 w-10',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'md', asChild = false, children, ...props }, ref) => {
    const classes = `inline-flex items-center justify-center rounded-lg font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coin-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-950 disabled:opacity-50 disabled:pointer-events-none ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
    
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


