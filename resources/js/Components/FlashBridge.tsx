import React, { useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { useNotification } from '@/Providers/NotificationProvider';

type FlashBridgeProps = {
  initialPageProps?: any;
};

export default function FlashBridge({ initialPageProps }: FlashBridgeProps) {
  // If initialPageProps is provided (when mounted at app root before Inertia context), use it.
  const pageProps = initialPageProps?.initialPage?.props || initialPageProps?.page?.props;
  const inertial = (() => {
    try {
      return usePage();
    } catch (e) {
      return null;
    }
  })();

  const flash = pageProps?.flash || (inertial ? (inertial.props as any).flash : undefined);
  const { push } = useNotification();

  useEffect(() => {
    if (!flash) return;
    const success = typeof flash.success === 'function' ? flash.success() : flash.success;
    const error = typeof flash.error === 'function' ? flash.error() : flash.error;
    const info = typeof flash.info === 'function' ? flash.info() : flash.info;

    if (success) push(success, 'success');
    if (error) push(error, 'error');
    if (info) push(info, 'info');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
