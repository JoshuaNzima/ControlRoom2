import { useEffect } from 'react';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { toast } from 'react-hot-toast';

declare global {
  interface Window {
    Pusher: any;
    Echo: any;
  }
}

// `pusher-js` may export the Pusher constructor as the default property
// depending on build tooling. Normalize and expose it globally so
// laravel-echo can find it, and also pass it explicitly to Echo below.
window.Pusher = (Pusher as any)?.default || Pusher;

const useNotifications = (userId: number) => {
  useEffect(() => {
    if (!window.Echo) {
      window.Echo = new Echo({
        broadcaster: 'pusher',
        key: process.env.VITE_PUSHER_APP_KEY,
        cluster: process.env.VITE_PUSHER_APP_CLUSTER,
        forceTLS: true,
        // Pass the Pusher client explicitly to avoid runtime "client not found" errors
        // when the global isn't available due to bundler/module interop quirks.
        client: window.Pusher,
      });
    }

    const channel = window.Echo.private(`supervisor.${userId}`);

    channel.listen('.QRScanned', (e: any) => {
      toast.success(e.message);
    });

    return () => {
      channel.stopListening('.QRScanned');
    };
  }, [userId]);
};

export default useNotifications;