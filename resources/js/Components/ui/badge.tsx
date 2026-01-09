import React from 'react';

type Props = {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'destructive';
  className?: string;
};

export function Badge({ children, variant = 'default', className = '' }: Props) {
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium';
  const variants: Record<string, string> = {
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100',
    secondary: 'bg-coin-100 text-coin-900 dark:bg-coin-900/30 dark:text-coin-200',
    outline: 'border border-gray-300 text-gray-700 dark:border-gray-700 dark:text-gray-200',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
    warning: 'bg-yellow-100 text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-200',
    destructive: 'bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-200',
  };
  return <span className={`${base} ${variants[variant] || variants.default} ${className}`}>{children}</span>;
}


