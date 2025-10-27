import * as React from 'react';

type BaseProps = React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode };

export function Card({ className = '', ...props }: BaseProps) {
  return <div className={`rounded-xl border border-gray-200 bg-white shadow ${className}`} {...props} />;
}

export function CardHeader({ className = '', ...props }: BaseProps) {
  return <div className={`p-4 border-b border-gray-100 ${className}`} {...props} />;
}

export function CardTitle({ className = '', ...props }: BaseProps) {
  return <h3 className={`text-lg font-semibold text-gray-900 ${className}`} {...props} />;
}

export function CardDescription({ className = '', ...props }: BaseProps) {
  return <p className={`text-sm text-gray-500 mt-1 ${className}`} {...props} />;
}

export function CardContent({ className = '', ...props }: BaseProps) {
  return <div className={`p-4 ${className}`} {...props} />;
}

export function CardFooter({ className = '', ...props }: BaseProps) {
  return <div className={`p-4 border-t border-gray-100 ${className}`} {...props} />;
}

export default Card;


