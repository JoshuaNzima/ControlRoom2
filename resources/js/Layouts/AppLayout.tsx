import React from 'react';

type Props = {
  children: React.ReactNode;
  title?: string;
};

export default function AppLayout({ children, title }: Props) {
  return (
    <div className="min-h-screen bg-red-50 dark:bg-gray-900">
      {title && (
        <header className="bg-white dark:bg-gray-800 border-b border-red-100 dark:border-gray-800 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <h1 className="text-xl font-bold text-red-900 dark:text-gray-100">{title}</h1>
          </div>
        </header>
      )}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-gray-900 dark:text-gray-100">{children}</main>
    </div>
  );
}


