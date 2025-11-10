import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

interface NotificationCounts {
  incidents: number;
  flags: number;
  downs: number;
}

interface NotificationsContextType {
  counts: NotificationCounts;
  refresh: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType>({
  counts: { incidents: 0, flags: 0, downs: 0 },
  refresh: async () => {},
});

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [counts, setCounts] = useState<NotificationCounts>({ incidents: 0, flags: 0, downs: 0 });

  const fetchCounts = async () => {
    try {
      // Default to absolute path
      let url = '/api/notifications/counts';
      
      // Try to use Ziggy route if available
      try {
        if (typeof route === 'function') {
          url = route('api.notifications.counts');
        }
      } catch (e) {
        console.warn('Using fallback URL for notifications API');
      }

      const response = await axios.get(url, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        },
        withCredentials: true
      });
      setCounts(response.data);
    } catch (error: any) {
      if (error.response?.status === 401) {
        // Handle unauthenticated state gracefully
        setCounts({ incidents: 0, flags: 0, downs: 0 });
      } else if (error.response?.status === 419) {
        // CSRF token mismatch, try to refresh the page
        window.location.reload();
      } else {
        console.error('Failed to fetch notification counts:', error);
        // Set empty counts to prevent UI errors
        setCounts({ incidents: 0, flags: 0, downs: 0 });
      }
    }
  };

  useEffect(() => {
    fetchCounts();
    // Poll for updates every minute
    const interval = setInterval(fetchCounts, 60000);

    // Real-time: subscribe to Echo notifications channel if available
    let channel: any = null;
    if ((window as any).Echo) {
      try {
        channel = (window as any).Echo.channel('notifications');
        // Listen for the server-broadcasted NotificationEvent (try a few likely event names)
        channel.listen('.NotificationEvent', () => fetchCounts());
        channel.listen('NotificationEvent', () => fetchCounts());
        channel.listen('.notification', () => fetchCounts());
      } catch (err) {
        console.warn('Failed to subscribe to Echo notifications channel', err);
      }
    }

    return () => {
      clearInterval(interval);
      try {
        if (channel) {
          channel.stopListening('.NotificationEvent');
          channel.stopListening('NotificationEvent');
          channel.stopListening('.notification');
        }
      } catch (err) {
        // ignore cleanup errors
      }
    };
  }, []);

  return (
    <NotificationsContext.Provider value={{ counts, refresh: fetchCounts }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationsContext);