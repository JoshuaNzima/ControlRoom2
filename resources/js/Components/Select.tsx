import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  children: React.ReactNode;
  id?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export default function Select({ label, children, className = '', onChange, ...props }: SelectProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <select
        className={`block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-coin-500 focus:outline-none focus:ring-1 focus:ring-coin-500 ${className}`}
        onChange={onChange}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
