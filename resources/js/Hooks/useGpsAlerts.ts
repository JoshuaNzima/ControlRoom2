import { useEffect } from 'react';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { toast } from 'react-hot-toast';

declare global {
  interface Window {
    Pusher?: any;
    Echo?: any;
  }
}

interface GPSMismatchEvent {
  user_id: number;
  site_id: number;
  site_name: string;
  distance_meters?: number | null;
  mismatch_count?: number;
  threshold?: number;
  window_minutes?: number;
  escalated?: boolean;
  message?: string;
  timestamp?: string;
}

window.Pusher = (Pusher as any)?.default || Pusher;

export default function useGpsAlerts() {
  useEffect(() => {
    if (!window.Echo) {
      window.Echo = new Echo({
        broadcaster: 'pusher',
        key: process.env.VITE_PUSHER_APP_KEY,
        cluster: process.env.VITE_PUSHER_APP_CLUSTER,
        forceTLS: true,
        client: window.Pusher,
      });
    }

    const channel = window.Echo.private('gps-alerts');

    channel.listen('.gps.mismatch', (e: GPSMismatchEvent) => {
      const distance = typeof e.distance_meters === 'number' ? Math.round(e.distance_meters) : null;
      const count = typeof e.mismatch_count === 'number' ? e.mismatch_count : null;
      const threshold = typeof e.threshold === 'number' ? e.threshold : null;

      if (e.escalated) {
        toast.error(
          `${e.message || 'Repeated GPS mismatches detected'}\n${e.site_name}${distance !== null ? ` (${distance}m)` : ''}${count !== null && threshold !== null ? `\nAttempts: ${count}/${threshold}` : ''}`,
          { duration: 8000 }
        );
      } else {
        toast(
          `${e.message || 'GPS mismatch'}\n${e.site_name}${distance !== null ? ` (${distance}m)` : ''}`,
          { duration: 4000 }
        );
      }
    });

    return () => {
      channel.stopListening('.gps.mismatch');
    };
  }, []);
}
