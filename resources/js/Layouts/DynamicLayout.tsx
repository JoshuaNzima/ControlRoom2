import React, { useState, useEffect } from "react";
import { Link, usePage } from "@inertiajs/react";
import BaseShell from './BaseShell';
import NotificationBell from '@/Components/Common/NotificationBell';
import QuickRequisitionButton from '@/Components/Requisitions/QuickRequisitionButton';
import { PageProps } from '@/types';
import { router } from "@inertiajs/react";

interface Module {
  name: string;
  display_name: string;
  icon: string;
  color: string;
  route: string;
  children: Array<{
    name: string;
    route: string;
    permission: string;
  }>;
}

interface Props {
  children: React.ReactNode;
  title?: string;
  modules: Module[];
}

export default function DynamicLayout({ children, title, modules }: Props) {
  const { auth } = usePage<PageProps<{ auth: { user: { permissions?: string[] } } }>>().props;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { url } = usePage();

  // Filter modules based on user permissions
  const availableModules = modules.filter(module => {
    const perms = auth?.user?.permissions || [];
    return module.children.some(child => perms.includes(child.permission));
  });

  return (
    <div className="flex flex-col h-screen bg-red-50 dark:bg-gray-900 md:flex-row">
      {/* Dynamic sidebar with modules */}
      <aside className="w-64 bg-red-900 dark:bg-gray-950 text-white">
        <div className="flex flex-col h-full">
          <div className="px-6 py-4 border-b border-red-800 dark:border-gray-800">
            <span className="font-bold text-xl text-white">CoinSec</span>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
            {availableModules.map((module, mIdx) => (
              <div key={`${module.name || 'module'}-${mIdx}`} className="space-y-2">
                <h3 className="text-xs font-semibold text-red-200 dark:text-gray-400 uppercase tracking-wider">
                  {module.display_name}
                </h3>
                {module.children
                  .filter(child => (auth?.user?.permissions || []).includes(child.permission))
                  .map((child, cIdx) => (
                    <Link
                      key={`${child.route || child.name}-${cIdx}`}
                      href={child.route ? route(child.route) : '#'}
                      className={`
                        flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                        ${url.startsWith(route(child.route))
                          ? 'bg-red-800 text-white font-medium dark:bg-gray-800'
                          : 'text-red-100 hover:bg-red-800 hover:text-white dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
                        }
                      `}
                    >
                      <span>{child.name}</span>
                    </Link>
                  ))}
              </div>
            ))}
          </nav>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <BaseShell
          title={title}
          fullScreen={false}
          header={
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-red-900 dark:text-gray-100">{title}</h1>
              <div className="flex items-center gap-3">
                <NotificationBell />
                <QuickRequisitionButton />
              </div>
            </div>
          }
        >
          {children}
        </BaseShell>
      </div>
    </div>
  );
}