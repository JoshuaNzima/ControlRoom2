import React, { useEffect, useState } from 'react';
import IconMapper from '@/Components/IconMapper';

type AppNotification = {
  id: string;
  type: string;
  data: any;
  read_at: string | null;
  created_at: string;
};

function getCsrfToken() {
  const el = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
  return el?.content || '';
}

export default function NotificationBell({ className = '' }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState<number>(0);
  const [items, setItems] = useState<AppNotification[]>([]);

  const fetchUnread = async () => {
    try {
      const res = await fetch('/notifications/unread-count', { credentials: 'same-origin' });
      if (!res.ok) return;
      const json = await res.json();
      setUnread(Number(json.count || 0));
    } catch {}
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await fetch('/notifications', { credentials: 'same-origin' });
      if (!res.ok) return;
      const json = await res.json();
      setItems(Array.isArray(json.notifications) ? json.notifications : []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch('/notifications/read-all', {
        method: 'POST',
        headers: {
          'X-CSRF-TOKEN': getCsrfToken(),
          'Accept': 'application/json'
        },
        credentials: 'same-origin',
      });
      setUnread(0);
      setItems((prev) => prev.map(i => ({ ...i, read_at: i.read_at || new Date().toISOString() })));
    } catch {}
  };

  const markOneRead = async (id: string) => {
    try {
      await fetch(`/notifications/${id}/read`, {
        method: 'POST',
        headers: {
          'X-CSRF-TOKEN': getCsrfToken(),
          'Accept': 'application/json'
        },
        credentials: 'same-origin',
      });
      setItems((prev) => prev.map(i => i.id === id ? ({ ...i, read_at: i.read_at || new Date().toISOString() }) : i));
      setUnread((prev) => (prev > 0 ? prev - 1 : 0));
    } catch {}
  };

  useEffect(() => {
    fetchUnread();
    fetchItems();
    const id = window.setInterval(fetchUnread, 30000);
    return () => window.clearInterval(id);
  }, []);

  const toggleOpen = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      // Refresh items/unread when opening, but don't auto-mark all as read
      await fetchUnread();
      await fetchItems();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={toggleOpen}
        className="relative p-2 rounded-md hover:bg-red-50 dark:hover:bg-gray-800 text-red-700 dark:text-gray-200"
        aria-label="Notifications"
      >
        <IconMapper name="bell" className="h-6 w-6" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 flex items-center justify-center text-xs font-bold bg-red-600 text-white rounded-full">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white dark:bg-gray-900 border border-red-100 dark:border-gray-800 rounded-lg shadow-xl z-50">
          <div className="flex items-center justify-between px-3 py-2 border-b border-red-100 dark:border-gray-800">
            <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">Notifications</div>
            <button onClick={markAllRead} className="text-xs text-red-600 hover:text-red-700">Mark all read</button>
          </div>
          <div className="max-h-80 overflow-auto">
            {loading ? (
              <div className="p-4 text-sm text-gray-500">Loading...</div>
            ) : items.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">No notifications</div>
            ) : (
              <ul className="divide-y divide-red-100 dark:divide-gray-800">
                {items.map((n) => (
                  <li key={n.id} className={`p-3 cursor-pointer ${!n.read_at ? 'bg-red-50/40 dark:bg-gray-800/40' : ''}`}
                    onClick={() => markOneRead(n.id)}>
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 text-red-600 dark:text-red-400">
                        <IconMapper name="bell" className="h-4 w-4" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-gray-100 truncate">{n.data?.title || n.type}</p>
                        {n.data?.message && (
                          <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">{n.data.message}</p>
                        )}
                        <p className="text-[10px] text-gray-500 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
