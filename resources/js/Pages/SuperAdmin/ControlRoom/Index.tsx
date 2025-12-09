import React from 'react';
import { Head, Link } from '@inertiajs/react';
import SuperAdminLayout from '@/Layouts/SuperAdminLayout';
import IconMapper from '@/Components/IconMapper';

export default function ControlRoomIndex() {
  const cards = [
    { title: 'Manage Control Room', icon: 'Wrench', href: route('superadmin.control-room.manage') },
    { title: 'Live Dashboard', icon: 'Activity', href: route('control-room.dashboard') },
    { title: 'Monitoring', icon: 'Monitor', href: route('control-room.monitoring') },
    { title: 'Incidents', icon: 'AlertTriangle', href: route('control-room.incidents.index') },
    { title: 'Alerts', icon: 'Bell', href: route('control-room.alerts') },
    { title: 'Shifts', icon: 'Clock', href: route('control-room.shifts.index') },
    { title: 'Zones', icon: 'MapPin', href: route('control-room.zones.index') },
  ];

  return (
    <SuperAdminLayout title="Control Room">
      <Head title="Super Admin • Control Room" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Control Room</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Super Admin control room oversight</p>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((c, i) => (
            <Link key={i} href={c.href} className="rounded-xl border dark:border-gray-700 p-4 bg-white dark:bg-gray-800 hover:border-coin-600 transition">
              <div className="flex items-center gap-3">
                <IconMapper name={c.icon} size={22} className="text-coin-700" />
                <div className="text-gray-900 dark:text-gray-100 font-medium">{c.title}</div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Actions</h2>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href={route('control-room.live.scans')} className="rounded-xl border dark:border-gray-700 p-4 bg-white dark:bg-gray-800 hover:border-coin-600 transition">
              <div className="flex items-center gap-3">
                <IconMapper name="Scan" size={22} className="text-coin-700" />
                <div className="text-gray-900 dark:text-gray-100 font-medium">Live Scans</div>
              </div>
            </Link>
            <Link href={route('control-room.live.attendance')} className="rounded-xl border dark:border-gray-700 p-4 bg-white dark:bg-gray-800 hover:border-coin-600 transition">
              <div className="flex items-center gap-3">
                <IconMapper name="Clock" size={22} className="text-coin-700" />
                <div className="text-gray-900 dark:text-gray-100 font-medium">Live Attendance</div>
              </div>
            </Link>
            <Link href={route('control-room.live.alerts')} className="rounded-xl border dark:border-gray-700 p-4 bg-white dark:bg-gray-800 hover:border-coin-600 transition">
              <div className="flex items-center gap-3">
                <IconMapper name="Bell" size={22} className="text-coin-700" />
                <div className="text-gray-900 dark:text-gray-100 font-medium">Live Alerts</div>
              </div>
            </Link>
            <Link href={route('control-room.live.stats')} className="rounded-xl border dark:border-gray-700 p-4 bg-white dark:bg-gray-800 hover:border-coin-600 transition">
              <div className="flex items-center gap-3">
                <IconMapper name="BarChart2" size={22} className="text-coin-700" />
                <div className="text-gray-900 dark:text-gray-100 font-medium">Live Stats</div>
              </div>
            </Link>
            <Link href={route('superadmin.audit')} className="rounded-xl border dark:border-gray-700 p-4 bg-white dark:bg-gray-800 hover:border-coin-600 transition">
              <div className="flex items-center gap-3">
                <IconMapper name="Search" size={22} className="text-coin-700" />
                <div className="text-gray-900 dark:text-gray-100 font-medium">Audit</div>
              </div>
            </Link>
            <Link href={route('superadmin.logs')} className="rounded-xl border dark:border-gray-700 p-4 bg-white dark:bg-gray-800 hover:border-coin-600 transition">
              <div className="flex items-center gap-3">
                <IconMapper name="FileText" size={22} className="text-coin-700" />
                <div className="text-gray-900 dark:text-gray-100 font-medium">Logs</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
