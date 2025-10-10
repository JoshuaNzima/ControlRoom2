import React from 'react';

type Props = {
  children: React.ReactNode;
  title?: string;
};

export default function AppLayout({ children, title }: Props) {
  return (
    <div className="min-h-screen bg-gray-50">
      {title && (
        <header className="bg-white border-b px-6 py-4">
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        </header>
      )}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</main>
    </div>
  );
}


