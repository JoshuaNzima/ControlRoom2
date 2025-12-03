import React, { useState, ReactNode } from 'react';

type Notification = { id: number; message: string; type?: 'info' | 'success' | 'error' | 'warning' };

interface NotificationContextValue {
  notifications: Notification[];
  push: (message: string, type?: Notification['type']) => void;
  remove: (id: number) => void;
}

const NotificationContext = React.createContext<NotificationContextValue | undefined>(undefined);
let idCounter = 1;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  function push(message: string, type: Notification['type'] = 'info') {
    const id = idCounter++;
    const n = { id, message, type };
    setNotifications((prev) => [n, ...prev].slice(0, 3));
    setTimeout(() => remove(id), 5000);
  }

  function remove(id: number) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <NotificationContext.Provider value={{ notifications, push, remove }}>
      {children}
      <div className="fixed z-50 flex flex-col gap-3 sm:top-6 sm:right-6 bottom-6 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 transform">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`px-4 py-2 rounded shadow-lg text-white flex items-center justify-between gap-3 ${
              n.type === 'error'
                ? 'bg-red-600'
                : n.type === 'warning'
                ? 'bg-amber-500'
                : n.type === 'success'
                ? 'bg-emerald-600'
                : 'bg-gray-900'
            }`}>
            <span className="text-sm">{n.message}</span>
            <button onClick={() => remove(n.id)} className="text-white/80 hover:text-white focus:outline-none" aria-label="Dismiss notification">×</button>
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
