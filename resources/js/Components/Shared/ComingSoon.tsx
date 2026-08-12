import React from 'react';
import { Link } from '@inertiajs/react';
import IconMapper from '@/Components/IconMapper';

interface ComingSoonProps {
  title: string;
  description?: string;
  backRoute?: string;
}

export default function ComingSoon({ 
  title, 
  description = "This feature is under development and will be available soon.",
  backRoute = 'supervisor.dashboard'
}: ComingSoonProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="text-6xl mb-6">🚧</div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">{title}</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">{description}</p>
        <Link
          href={route(backRoute)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white rounded-lg font-medium transition"
        >
          <IconMapper name="ArrowLeft" size={18} />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}