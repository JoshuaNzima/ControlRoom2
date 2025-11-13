import React, { useState } from 'react';
import type { Flag } from '@/types/index';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ExclamationCircleIcon, ClockIcon, UserIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
interface FlagListProps {
  flags: Flag[];
  onFlagClick: (flag: Flag) => void;
}

const priorityColors: Record<Flag['priority'], string> = {
  critical: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-green-100 text-green-800',
};

export default function FlagList({ flags, onFlagClick }: FlagListProps) {
  const [filter, setFilter] = useState('all');
  
  const filteredFlags = flags.filter(flag => {
    if (filter === 'all') return true;
    return flag.priority === filter;
  });

  return (
    <div className="space-y-4">
      <div className="flex space-x-2 mb-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option value="all">All Flags</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <div className="space-y-2">
        {filteredFlags.map((flag) => (
          <motion.div
            key={flag.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01 }}
            onClick={() => onFlagClick(flag)}
            className={clsx(
              'p-4 rounded-lg shadow-sm border cursor-pointer transition-all',
              'hover:shadow-md bg-white'
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className={clsx(
                    'px-2 py-1 rounded-full text-xs font-medium',
                    priorityColors[flag.priority]
                  )}>
                    {flag.priority.toUpperCase()}
                  </span>
                  <span className="text-sm text-gray-500">{flag.category}</span>
                </div>
                <h3 className="mt-1 font-medium">{flag.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{flag.description}</p>
              </div>
            </div>

            <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center">
                <ClockIcon className="h-4 w-4 mr-1" />
                {format(new Date(flag.created_at), 'MMM d, yyyy HH:mm')}
              </div>
              {flag.repeat_occurrence > 0 && (
                <div className="flex items-center">
                  <ExclamationCircleIcon className="h-4 w-4 mr-1 text-orange-500" />
                  Repeat: {flag.repeat_occurrence}x
                </div>
              )}
              <div className="flex items-center">
                <UserIcon className="h-4 w-4 mr-1" />
                {flag.reporter_name}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}