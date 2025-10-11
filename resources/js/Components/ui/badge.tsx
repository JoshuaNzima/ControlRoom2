import React from 'react';

type Props = {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'destructive';
  className?: string;
};

export function Badge({ children, variant = 'default', className = '' }: Props) {
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium';
  const variants: Record<string, string> = {
    default: 'bg-gray-100 text-gray-800',
    secondary: 'bg-indigo-100 text-indigo-800',
    outline: 'border border-gray-300 text-gray-700',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    destructive: 'bg-red-100 text-red-800',
  };
  return <span className={`${base} ${variants[variant] || variants.default} ${className}`}>{children}</span>;
}


