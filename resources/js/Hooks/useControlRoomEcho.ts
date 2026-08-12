import { useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';

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

/**
 * Hook to listen for QR scan events on the control-room channel.
 * Relies on the Echo instance already initialised in bootstrap.ts.
 */
const useControlRoomEcho = (onScanUpdate?: (event: QRScanEvent) => void) => {
  const handleQRScanned = useCallback((e: QRScanEvent) => {
    // Show toast notification with scan details
    const data = e?.data ?? {} as any;
    const message = `${e?.message ?? 'QR Scan'}\n${data.site_name ?? 'Unknown'} - ${data.supervisor_name ?? 'Unknown'}`;
    toast.success(message, { duration: 5000 });

    // Call optional callback for custom handling
    if (onScanUpdate) {
      onScanUpdate(e);
    }
  }, [onScanUpdate]);

  useEffect(() => {
    const echo = (window as any).Echo;

    // If Echo is not properly configured (just a stub), skip listening
    if (!echo || typeof echo.private !== 'function') {
      return;
    }

    let channel: any;
    try {
      channel = echo.private('control-room');
      // Listen for the Laravel QRScanned event (class-based event name)
      channel.listen('QRScanned', handleQRScanned);
    } catch (err) {
      console.warn('useControlRoomEcho: failed to subscribe', err);
      return;
    }

    return () => {
      try {
        channel?.stopListening('.QRScanned');
      } catch {}
    };
  }, [handleQRScanned]);
};

export default useControlRoomEcho;
export type { QRScanEvent };
