import React, { useState, ReactNode, useCallback, useRef, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  X,
  AlertCircle,
  Bell
} from 'lucide-react';

export type NotificationType = 'info' | 'success' | 'error' | 'warning';

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  title?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
  createdAt: number;
}

interface NotificationContextValue {
  notifications: Notification[];
  push: (message: string, type?: NotificationType, options?: Omit<Partial<Notification>, 'id' | 'message' | 'type' | 'createdAt'>) => void;
  pushSuccess: (message: string, options?: Omit<Partial<Notification>, 'id' | 'message' | 'type' | 'createdAt'>) => void;
  pushError: (message: string, options?: Omit<Partial<Notification>, 'id' | 'message' | 'type' | 'createdAt'>) => void;
  pushWarning: (message: string, options?: Omit<Partial<Notification>, 'id' | 'message' | 'type' | 'createdAt'>) => void;
  pushInfo: (message: string, options?: Omit<Partial<Notification>, 'id' | 'message' | 'type' | 'createdAt'>) => void;
  remove: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = React.createContext<NotificationContextValue | undefined>(undefined);

// Generate unique ID
const generateId = () => `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Icon mapping for notification types
const notificationIcons: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

// Color scheme mapping for dark theme (coin red/orange accent compatible)
const notificationStyles: Record<NotificationType, {
  bg: string;
  border: string;
  icon: string;
  progress: string;
}> = {
  success: {
    bg: 'bg-gray-900 dark:bg-gray-950',
    border: 'border-emerald-500/50',
    icon: 'text-emerald-500',
    progress: 'bg-emerald-500',
  },
  error: {
    bg: 'bg-gray-900 dark:bg-gray-950',
    border: 'border-red-500/50',
    icon: 'text-red-500',
    progress: 'bg-red-500',
  },
  warning: {
    bg: 'bg-gray-900 dark:bg-gray-950',
    border: 'border-amber-500/50',
    icon: 'text-amber-500',
    progress: 'bg-amber-500',
  },
  info: {
    bg: 'bg-gray-900 dark:bg-gray-950',
    border: 'border-coin-500/50',
    icon: 'text-coin-500',
    progress: 'bg-coin-500',
  },
};

// Individual notification component with progress bar and animations
function NotificationItem({
  notification,
  onRemove,
  isExiting,
}: {
  notification: Notification;
  onRemove: (id: string) => void;
  isExiting: boolean;
}) {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const duration = notification.duration || 5000;
  const Icon = notificationIcons[notification.type];
  const styles = notificationStyles[notification.type];
  const startTimeRef = useRef(Date.now());
  const remainingRef = useRef(duration);

  useEffect(() => {
    if (isPaused || isExiting) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, remainingRef.current - elapsed);
      const newProgress = (remaining / duration) * 100;

      setProgress(newProgress);

      if (remaining <= 0) {
        clearInterval(interval);
        onRemove(notification.id);
      }
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [isPaused, isExiting, duration, notification.id, onRemove]);

  const handleMouseEnter = () => {
    setIsPaused(true);
    remainingRef.current = Math.max(0, remainingRef.current - (Date.now() - startTimeRef.current));
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
    startTimeRef.current = Date.now();
  };

  const handleClose = () => {
    notification.onClose?.();
    onRemove(notification.id);
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`
        relative overflow-hidden rounded-lg shadow-xl border ${styles.bg} ${styles.border}
        transform transition-all duration-300 ease-out
        ${isExiting ? 'animate-slideOutRight opacity-0' : 'animate-slideInRight'}
        min-w-[280px] sm:min-w-[320px] max-w-[90vw] sm:max-w-[400px]
      `}
      role="alert"
      aria-live="polite"
    >
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gray-700/30">
        <div
          className={`h-full ${styles.progress} transition-all duration-100 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="p-3 sm:p-4 flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 ${styles.icon}`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {notification.title && (
            <h4 className="text-sm font-semibold text-gray-100 mb-0.5">
              {notification.title}
            </h4>
          )}
          <p className="text-sm text-gray-300 leading-relaxed">
            {notification.message}
          </p>

          {/* Action button */}
          {notification.action && (
            <button
              onClick={() => {
                notification.action?.onClick();
                handleClose();
              }}
              className={`
                mt-2 text-xs font-medium px-3 py-1.5 rounded
                ${styles.icon} bg-current/10 hover:bg-current/20
                transition-colors duration-200
              `}
            >
              {notification.action.label}
            </button>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="
            flex-shrink-0 p-1 rounded-full
            text-gray-500 hover:text-gray-300 hover:bg-gray-800
            transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-coin-500/50
          "
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());
  const maxNotifications = 5;

  const remove = useCallback((id: string) => {
    setExitingIds(prev => new Set(prev).add(id));
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
      setExitingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 300); // Match animation duration
  }, []);

  const clearAll = useCallback(() => {
    notifications.forEach(n => remove(n.id));
  }, [notifications, remove]);

  const push = useCallback((
    message: string,
    type: NotificationType = 'info',
    options: Omit<Partial<Notification>, 'id' | 'message' | 'type' | 'createdAt'> = {}
  ) => {
    const id = generateId();
    const notification: Notification = {
      id,
      message,
      type,
      createdAt: Date.now(),
      ...options,
    };

    setNotifications(prev => {
      // Remove oldest if at max capacity
      const next = [notification, ...prev];
      if (next.length > maxNotifications) {
        const toRemove = next.slice(maxNotifications);
        toRemove.forEach(n => remove(n.id));
        return next.slice(0, maxNotifications);
      }
      return next;
    });

    // Auto-remove after duration
    const duration = options.duration || 5000;
    setTimeout(() => remove(id), duration);
  }, [remove]);

  // Convenience methods
  const pushSuccess = useCallback((message: string, options?: Omit<Partial<Notification>, 'id' | 'message' | 'type' | 'createdAt'>) => {
    push(message, 'success', options);
  }, [push]);

  const pushError = useCallback((message: string, options?: Omit<Partial<Notification>, 'id' | 'message' | 'type' | 'createdAt'>) => {
    push(message, 'error', { duration: 8000, ...options }); // Errors stay longer
  }, [push]);

  const pushWarning = useCallback((message: string, options?: Omit<Partial<Notification>, 'id' | 'message' | 'type' | 'createdAt'>) => {
    push(message, 'warning', options);
  }, [push]);

  const pushInfo = useCallback((message: string, options?: Omit<Partial<Notification>, 'id' | 'message' | 'type' | 'createdAt'>) => {
    push(message, 'info', options);
  }, [push]);

  const value: NotificationContextValue = {
    notifications,
    push,
    pushSuccess,
    pushError,
    pushWarning,
    pushInfo,
    remove,
    clearAll,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}

      {/* Notification container - mobile bottom, desktop top-right */}
      <div
        className="
          fixed z-[9999] flex flex-col gap-2 sm:gap-3
          bottom-4 left-4 right-4 sm:bottom-auto sm:left-auto sm:right-4 sm:top-4
          items-stretch sm:items-end
          pointer-events-none
        "
        aria-live="polite"
        aria-atomic="true"
      >
        {notifications.map((notification) => (
          <div key={notification.id} className="pointer-events-auto">
            <NotificationItem
              notification={notification}
              onRemove={remove}
              isExiting={exitingIds.has(notification.id)}
            />
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = React.useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
}

// Legacy hook name for backward compatibility
export const useNotifications = useNotification;
