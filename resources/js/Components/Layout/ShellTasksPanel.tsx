import React from 'react';
import WeeklyTasks from '@/Components/WeeklyTasks';
import { motion, AnimatePresence } from 'framer-motion';

interface ShellTasksPanelProps {
  tasksOpen: boolean;
  weeklyTasks: any[];
  isExecutiveAssistant?: boolean;
  showModule?: boolean;
  /** For mobile: renders a fixed overlay panel */
  isMobile?: boolean;
  onClose?: () => void;
}

export default function ShellTasksPanel({
  tasksOpen,
  weeklyTasks,
  isExecutiveAssistant = false,
  showModule = true,
  isMobile = false,
  onClose,
}: ShellTasksPanelProps) {
  // Desktop: renders as grid column
  if (!isMobile) {
    return (
      <AnimatePresence>
        {tasksOpen && (
          <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.95 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="xl:col-span-1"
          >
            <WeeklyTasks
              tasks={weeklyTasks || []}
              showModule={showModule}
              isExecutiveAssistant={isExecutiveAssistant}
            />
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Mobile: renders as fixed overlay
  if (!tasksOpen) return null;
  return (
    <WeeklyTasks
      tasks={weeklyTasks || []}
      showModule={showModule}
      isExecutiveAssistant={isExecutiveAssistant}
      isOpen={tasksOpen}
      onClose={onClose}
    />
  );
}
