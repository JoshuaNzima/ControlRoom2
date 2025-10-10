import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';

interface Module {
    name: string;
    display_name: string;
    is_active: boolean;
}

interface ModuleIndexProps {
    modules: Module[];
}

export default function ModuleIndex({ modules }: ModuleIndexProps) {
  return (
    <AdminLayout title="Modules">
      <Head title="Modules" />
      <div className="p-4">
        <h1 className="text-2xl font-bold">Modules</h1>
        <ul>
            {modules.map(module => (
                <li key={module.name}>{module.display_name} - {module.is_active ? 'Active' : 'Inactive'}</li>
            ))}
        </ul>
      </div>
    </AdminLayout>
  );
}
