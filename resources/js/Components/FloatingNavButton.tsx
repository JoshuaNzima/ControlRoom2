import { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
  Home,
  Users,
  Shield,
  Building2,
  Wallet,
  FileText,
  Settings,
  X,
  Menu,
  AlertCircle,
  Building,
  Briefcase,
  GraduationCap,
  BarChart3,
  UserCircle,
  LogOut,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: any;
  color: string;
  roles?: string[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: Home, color: 'bg-blue-600', roles: [] },
  { label: 'Guards', href: '/guards', icon: Shield, color: 'bg-red-600', roles: [] },
  { label: 'Control Room', href: '/control-room', icon: Building2, color: 'bg-amber-600', roles: ['control_room', 'admin', 'super_admin'] },
  { label: 'HR', href: '/hr', icon: Users, color: 'bg-emerald-600', roles: ['hr', 'admin', 'super_admin'] },
  { label: 'Finance', href: '/finance', icon: Wallet, color: 'bg-purple-600', roles: ['finance', 'admin', 'super_admin'] },
  { label: 'Assets', href: '/assets', icon: Building, color: 'bg-cyan-600', roles: ['asset_manager', 'admin', 'super_admin'] },
  { label: 'Requisitions', href: '/requisitions', icon: FileText, color: 'bg-orange-600', roles: [] },
  { label: 'Training', href: '/training', icon: GraduationCap, color: 'bg-pink-600', roles: ['training', 'admin', 'super_admin'] },
  { label: 'Reports', href: '/reports', icon: BarChart3, color: 'bg-indigo-600', roles: [] },
  { label: 'Emergency', href: '/emergency-contacts', icon: AlertCircle, color: 'bg-red-700', roles: [] },
  { label: 'Profile', href: '/profile', icon: UserCircle, color: 'bg-gray-600', roles: [] },
  { label: 'Admin', href: '/admin', icon: Settings, color: 'bg-slate-600', roles: ['admin', 'super_admin'] },
];

export default function FloatingNavButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { auth } = usePage().props as any;
  const userRoles = auth?.user?.roles || [];

  // Hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.floating-nav-container')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Filter nav items based on user roles
  const filteredNavItems = navItems.filter(item => {
    if (!item.roles || item.roles.length === 0) return true;
    return item.roles.some(role => userRoles.includes(role));
  });

  return (
    <div className={`floating-nav-container fixed bottom-6 right-6 z-50 transition-transform duration-300 ${isVisible ? 'translate-y-0' : 'translate-y-24'}`}>
      {/* Navigation Menu */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 mb-2">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-3 min-w-[200px] max-h-[70vh] overflow-y-auto">
            <div className="space-y-1">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className={`p-2 rounded-lg ${item.color}`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
            
            {/* Logout */}
            <div className="border-t border-gray-800 mt-2 pt-2">
              <Link
                href={route('logout')}
                method="post"
                as="button"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:bg-red-900/30 hover:text-red-400 transition-colors w-full"
              >
                <div className="p-2 rounded-lg bg-red-900/50">
                  <LogOut className="h-4 w-4 text-red-400" />
                </div>
                <span className="text-sm font-medium">Logout</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-4 rounded-full shadow-2xl transition-all duration-300 ${
          isOpen 
            ? 'bg-red-600 rotate-90 scale-110' 
            : 'bg-gradient-to-br from-red-600 to-red-800 hover:scale-110 hover:shadow-red-900/50'
        }`}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <Menu className="h-6 w-6 text-white" />
        )}
        
        {/* Pulse animation when closed */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-red-600 animate-ping opacity-20" />
        )}
      </button>
    </div>
  );
}
