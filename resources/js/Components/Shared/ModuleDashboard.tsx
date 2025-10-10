// resources/js/Components/Shared/ModuleDashboard.tsx
import React from 'react';
import { Link } from '@inertiajs/react';

interface ModuleItem {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  color: 'green' | 'blue' | 'yellow' | 'gray' | 'orange' | 'red';
  stats?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

interface ModuleDashboardProps {
  modules: ModuleItem[];
  title?: string;
  description?: string;
}

const colorClasses = {
  green: 'from-green-500 to-emerald-600',
  blue: 'from-blue-500 to-cyan-600',
  yellow: 'from-yellow-500 to-amber-600',
  gray: 'from-gray-500 to-gray-600',
  orange: 'from-orange-500 to-amber-600',
  red: 'from-red-500 to-rose-600',
} as const;

const colorHoverClasses = {
  green: 'hover:from-green-600 hover:to-emerald-700',
  blue: 'hover:from-blue-600 hover:to-cyan-700',
  yellow: 'hover:from-yellow-600 hover:to-amber-700',
  gray: 'hover:from-gray-600 hover:to-gray-700',
  orange: 'hover:from-orange-600 hover:to-amber-700',
  red: 'hover:from-red-600 hover:to-rose-700',
} as const;

export default function ModuleDashboard({ modules, title, description }: ModuleDashboardProps) {
  return (
    <div className="space-y-6">
      {(title || description) && (
        <div className="text-center">
          {title && <h1 className="text-3xl font-bold text-gray-900">{title}</h1>}
          {description && <p className="mt-2 text-lg text-gray-600">{description}</p>}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {modules.map((module, index) => (
          <Link
            key={index}
            href={module.href}
            className="group block"
          >
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all duration-200 group-hover:shadow-md group-hover:border-gray-300 group-hover:scale-105">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-r ${colorClasses[module.color]} mb-4`}>
                    {module.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-gray-700">
                    {module.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                    {module.description}
                  </p>
                  
                  {(module.stats || module.trend) && (
                    <div className="mt-4 flex items-center justify-between">
                      {module.stats && (
                        <span className="text-2xl font-bold text-gray-900">
                          {module.stats}
                        </span>
                      )}
                      {module.trend && (
                        <span className={`text-sm font-medium ${
                          module.trend.isPositive ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {module.trend.value}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}