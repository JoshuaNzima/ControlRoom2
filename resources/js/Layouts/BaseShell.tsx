import React from 'react';
import { Head } from '@inertiajs/react';

type Props = {
  title?: string;
  header?: React.ReactNode;
  children: React.ReactNode;
  wrapperClassName?: string;
  containerClassName?: string;
  fullScreen?: boolean;
  noHeader?: boolean;
};

export default function BaseShell({
  title,
  header,
  children,
  wrapperClassName = '',
  containerClassName = '',
  fullScreen = true,
  noHeader = false,
}: Props) {
  const wrapCls = `${fullScreen ? 'min-h-screen' : 'min-h-0'} bg-red-50 dark:bg-gray-950 ${wrapperClassName}`.trim();

  return (
    <div className={wrapCls}>
      {title && <Head title={title} />}
      {!noHeader && (
        <header className="sticky top-0 z-30 border-b border-red-100 bg-white/95 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/80">
          <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4">
            {header ? header : (title ? <h1 className="text-lg sm:text-xl font-bold text-red-900 dark:text-gray-100">{title}</h1> : null)}
          </div>
        </header>
      )}
      <main>
        <div className={`max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 text-gray-900 dark:text-gray-100 ${containerClassName}`.trim()}>
          {children}
        </div>
      </main>
    </div>
  );
}
