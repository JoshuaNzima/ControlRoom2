import React, { useState, useEffect } from "react";
import { Link, usePage } from "@inertiajs/react";
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
  const { auth } = usePage().props as any;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { url } = usePage();

  // Filter modules based on user permissions
  const availableModules = modules.filter(module => {
    return module.children.some(child => 
      auth.user.permissions.includes(child.permission)
    );
  });

  return (
    <div className="flex flex-col h-screen bg-gray-50 md:flex-row">
      {/* Dynamic sidebar with modules */}
      <aside className="bg-white shadow-sm border-r w-64">
        <div className="flex flex-col h-full">
          <div className="px-6 py-4 border-b">
            <span className="font-bold text-xl text-gray-900">CoinSec</span>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
            {availableModules.map((module, mIdx) => (
              <div key={`${module.name || 'module'}-${mIdx}`} className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {module.display_name}
                </h3>
                {module.children
                  .filter(child => auth.user.permissions.includes(child.permission))
                  .map((child, cIdx) => (
                    <Link
                      key={`${child.route || child.name}-${cIdx}`}
                      href={child.route ? route(child.route) : '#'}
                      className={`
                        flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                        ${url.startsWith(route(child.route))
                          ? 'bg-indigo-100 text-indigo-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
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
        <header className="h-16 bg-white border-b px-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}