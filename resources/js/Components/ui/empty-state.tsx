import * as React from 'react';

type EmptyStateVariant = 'card' | 'inline';
type EmptyStateSize = 'sm' | 'md';

type EmptyStateProps = React.HTMLAttributes<HTMLDivElement> & {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  variant?: EmptyStateVariant;
  size?: EmptyStateSize;
  contentClassName?: string;
};

export function EmptyState({
  title,
  description,
  icon,
  action,
  variant = 'inline',
  size = 'md',
  contentClassName = '',
  className = '',
  ...props
}: EmptyStateProps) {
  const wrapClasses = variant === 'card'
    ? 'rounded-xl border border-gray-200 bg-white shadow-sm shadow-black/5 dark:border-gray-800 dark:bg-gray-900/60 dark:shadow-none'
    : '';
  const padClasses = size === 'sm' ? 'px-4 py-6' : 'px-4 py-10';

  return (
    <div className={`${wrapClasses} ${className}`} {...props}>
      <div className={`${padClasses} ${contentClassName} text-center`}>
        {icon ? <div className="mx-auto mb-3 flex justify-center text-coin-700 dark:text-coin-300">{icon}</div> : null}
        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</div>
        {description ? <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">{description}</div> : null}
        {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
      </div>
    </div>
  );
}

export default EmptyState;
