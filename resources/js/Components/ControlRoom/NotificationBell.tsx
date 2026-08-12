import React, { useEffect, useState } from 'react';
import { Dialog } from '@headlessui/react';
import { BellIcon } from '@heroicons/react/24/outline';

interface Notification {
  id: number;
  title: string;
  message: string;
  createdAt: string;
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if ((window as any).Echo) {
      const channel = (window as any).Echo.private('control-room');
      channel.listen('.ScanTagged', (e: any) => {
        const notification = {
          id: Date.now(),
          title: 'New Scan Tagged',
          message: `New scan recorded at ${e.scan_tag.tags.site_name}`,
          createdAt: new Date().toISOString()
        };
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      });
      return () => channel.stopListening('.ScanTagged');
    }
  }, []);

  const handleBellClick = () => {
    setIsOpen(true);
    setUnreadCount(0);
  };

  return (
    <>
      <button
        onClick={handleBellClick}
        className="relative p-2 text-gray-600 hover:text-gray-900"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        className="fixed inset-0 z-50 overflow-y-auto"
      >
        <div className="min-h-screen px-4 text-center">
          {/* headlessui v2 typings don't expose Dialog.Overlay; use a simple backdrop div */}
          <div className="fixed inset-0 bg-black opacity-30" aria-hidden="true" />
          <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
            <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
              Notifications
            </Dialog.Title>
            <div className="mt-4 max-h-96 overflow-y-auto">
              {notifications.map(notification => (
                <div key={notification.id} className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-sm">{notification.title}</h4>
                  <p className="text-sm text-gray-600">{notification.message}</p>
                  <time className="text-xs text-gray-500">
                    {new Date(notification.createdAt).toLocaleString()}
                  </time>
                </div>
              ))}
              {notifications.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">
                  No notifications yet
                </p>
              )}
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
}