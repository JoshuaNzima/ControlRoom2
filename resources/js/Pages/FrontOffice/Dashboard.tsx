import React, { useState, useEffect, useMemo } from 'react';
import { Head, usePage, Link } from '@inertiajs/react';
import FrontOfficeLayout from '@/Layouts/FrontOfficeLayout';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import IconMapper from '@/Components/IconMapper';

// Role Selection Card
interface RoleCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
  duties: string[];
}

const RoleCard: React.FC<RoleCardProps> = ({ title, description, icon, href, color, duties }) => {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 
        bg-white dark:bg-gray-800 p-6 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
    >
      <div className={`absolute top-0 right-0 w-32 h-32 -mr-12 -mt-12 rounded-full opacity-10 ${color}`} />
      <div className={`absolute bottom-0 left-0 w-24 h-24 -ml-8 -mb-8 rounded-full opacity-5 ${color}`} />
      
      <div className={`inline-flex p-4 rounded-xl ${color} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      
      <h3 className="mt-5 text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h3>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{description}</p>
      
      <div className="mt-4 space-y-1">
        {duties.slice(0, 4).map((duty, idx) => (
          <div key={idx} className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <IconMapper name="CheckCircle" size={12} className="mr-2 text-emerald-500" />
            {duty}
          </div>
        ))}
        {duties.length > 4 && (
          <p className="text-xs text-red-500 dark:text-red-400">+{duties.length - 4} more duties</p>
        )}
      </div>
      
      <div className="mt-6 flex items-center text-sm font-medium text-red-600 dark:text-red-400">
        <span>Enter Module</span>
        <IconMapper name="ArrowRight" size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
};

// Quick Task Tile
const TaskTile: React.FC<{
  icon: React.ReactNode;
  title: string;
  count?: number;
  color: string;
}> = ({ icon, title, count = 0, color }) => {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all">
      <div className={`p-3 rounded-lg ${color} text-white shadow-md`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{count} pending</p>
      </div>
      {count > 0 && (
        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
          {count}
        </span>
      )}
    </div>
  );
};

type PageProps = {
  auth?: any;
  userRole?: 'executive_assistant' | 'personal_assistant' | null;
  stats?: {
    calendar_events_today: number;
    pending_communications: number;
    upcoming_meetings: number;
    pending_tasks: number;
  };
};

export default function FrontOfficeDashboard() {
  const { auth, userRole = null, stats = {
    calendar_events_today: 0,
    pending_communications: 0,
    upcoming_meetings: 0,
    pending_tasks: 0,
  } } = usePage<PageProps>().props as any;
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const assistantDuties = [
    'Calendar & Schedule Management',
    'Communication Management',
    'Meeting Coordination',
    'Travel Arrangements',
    'Report Preparation',
    'Petty Cash Management',
    'Diary Management',
    'Calls & Messages',
    'Personal Errands',
    'Event Planning',
    'Reminders & Follow-ups',
  ];

  // Check if user has assistant access
  const hasAssistantRole = auth?.user?.roles?.includes('assistant') || 
    auth?.user?.roles?.includes('executive_assistant') || 
    auth?.user?.roles?.includes('personal_assistant') ||
    auth?.user?.roles?.includes('manager') || 
    auth?.user?.roles?.includes('admin') || 
    auth?.user?.roles?.includes('super_admin');

  return (
    <FrontOfficeLayout title="Front Office" user={auth?.user}>
      <Head title="Front Office" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-700 via-red-600 to-rose-600 text-white shadow-2xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20" />
          
          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                  <IconMapper name="Briefcase" size={32} />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">
                    Welcome{auth?.user?.name ? `, ${auth.user.name}` : ''}
                  </h1>
                  <p className="text-red-100 mt-1">Front Office Management Portal</p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-4">
                <div className="px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm">
                  <p className="text-xs text-red-200">System Time</p>
                  <p className="text-lg font-mono font-semibold">
                    {currentTime.toLocaleTimeString('en-US', { hour12: false })}
                  </p>
                </div>
                <div className="px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm">
                  <p className="text-xs text-red-200">Today</p>
                  <p className="text-sm font-semibold">
                    {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assistant Access Card */}
        {hasAssistantRole && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Assistant Portal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <RoleCard
                title="Assistant Dashboard"
                description="Unified executive and personal support tasks, calendar, meetings, errands, and coordination"
                icon={<IconMapper name="Briefcase" size={28} />}
                href={route('front-office.assistant')}
                color="bg-gradient-to-br from-blue-600 to-purple-600"
                duties={assistantDuties}
              />
            </div>
          </div>
        )}

        {/* Today's Overview */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Today's Overview</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <TaskTile
              icon={<IconMapper name="Calendar" size={20} />}
              title="Calendar Events"
              count={stats.calendar_events_today}
              color="bg-blue-600"
            />
            <TaskTile
              icon={<IconMapper name="MessageSquare" size={20} />}
              title="Pending Communications"
              count={stats.pending_communications}
              color="bg-amber-600"
            />
            <TaskTile
              icon={<IconMapper name="Users" size={20} />}
              title="Upcoming Meetings"
              count={stats.upcoming_meetings}
              color="bg-emerald-600"
            />
            <TaskTile
              icon={<IconMapper name="ClipboardList" size={20} />}
              title="Pending Tasks"
              count={stats.pending_tasks}
              color="bg-purple-600"
            />
          </div>
        </div>

        {/* Quick Access Info */}
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <IconMapper name="Info" size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Front Office Hub</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Access the Assistant Dashboard to manage both executive and personal support tasks 
                including calendars, meetings, errands, travel arrangements, and more.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </FrontOfficeLayout>
  );
}
