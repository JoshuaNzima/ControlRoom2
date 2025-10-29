import { useEffect } from 'react';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { toast } from 'react-hot-toast';

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: any;
  }
}

window.Pusher = Pusher;

const useNotifications = (userId: number) => {
  useEffect(() => {
    if (!window.Echo) {
      window.Echo = new Echo({
        broadcaster: 'pusher',
        key: process.env.VITE_PUSHER_APP_KEY,
        cluster: process.env.VITE_PUSHER_APP_CLUSTER,
        forceTLS: true,
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