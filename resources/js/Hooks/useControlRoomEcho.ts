import { useEffect, useCallback } from 'react';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { toast } from 'react-hot-toast';

declare global {
  interface Window {
    Pusher?: any;
    Echo?: any;
  }
}

interface QRScanEvent {
  message: string;
  data: {
    id: number;
    supervisor_name: string;
    site_name: string;
    client_name: string;
    scanned_at: string;
    location_verified: boolean;
    latitude?: number;
    longitude?: number;
  };
}

// `pusher-js` may export the Pusher constructor as the default property
window.Pusher = (Pusher as any)?.default || Pusher;

/**
 * Hook to listen for QR scan events on the control-room channel
 * This allows control room operators to see real-time scan updates from all supervisors
 */
const useControlRoomEcho = (onScanUpdate?: (event: QRScanEvent) => void) => {
  const handleQRScanned = useCallback((e: QRScanEvent) => {
    // Show toast notification with scan details
    const message = `${e.message}\n${e.data.site_name} - ${e.data.supervisor_name}`;
    toast.success(message, { duration: 5000 });

    // Call optional callback for custom handling
    if (onScanUpdate) {
      onScanUpdate(e);
    }
  }, [onScanUpdate]);

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

    // Listen on the control-room channel for all scan events
    const channel = window.Echo.private('control-room');

    channel.listen('.QRScanned', handleQRScanned);

    return () => {
      channel.stopListening('.QRScanned');
    };
  }, [handleQRScanned]);
};

export default useControlRoomEcho;
export type { QRScanEvent };
