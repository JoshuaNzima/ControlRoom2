import React, { createContext, useContext, useState, ReactNode } from 'react';

type Notification = { id: number; message: string; type?: 'info' | 'success' | 'error' };

interface NotificationContextValue {
  notifications: Notification[];
  push: (message: string, type?: Notification['type']) => void;
  remove: (id: number) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);
let idCounter = 1;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  function push(message: string, type: Notification['type'] = 'info') {
    const id = idCounter++;
    const n = { id, message, type };
    setNotifications((prev) => [n, ...prev]);
    setTimeout(() => remove(id), 3500);
  }

  function remove(id: number) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <NotificationContext.Provider value={{ notifications, push, remove }}>
      {children}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`px-4 py-2 rounded shadow-lg text-white ${n.type === 'error' ? 'bg-red-600' : n.type === 'success' ? 'bg-green-600' : 'bg-gray-800'}`}>
            {n.message}
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
}
