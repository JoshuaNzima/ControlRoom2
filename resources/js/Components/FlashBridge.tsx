import React, { useEffect, useRef } from 'react';
import { usePage } from '@inertiajs/react';
import { useNotification } from '@/Providers/NotificationProvider';

type FlashBridgeProps = {
  initialPageProps?: any;
};

export default function FlashBridge({ initialPageProps }: FlashBridgeProps) {
  const pageProps = initialPageProps?.initialPage?.props || initialPageProps?.page?.props;
  let inertial: any = null;
  try { inertial = usePage(); } catch {}

  const { push } = useNotification();
  const seen = useRef<Set<string>>(new Set());

  const props: any = inertial ? inertial.props : pageProps || {};
  const flash = props?.flash || {};
  const toasts = Array.isArray(props?.toasts) ? props.toasts : [];

  useEffect(() => {
    const legacy: Array<{ message: string; type?: 'success' | 'error' | 'info' | 'warning' }> = [];
    const success = typeof flash.success === 'function' ? flash.success() : flash.success;
    const error = typeof flash.error === 'function' ? flash.error() : flash.error;
    const info = typeof flash.info === 'function' ? flash.info() : flash.info;
    const warning = typeof flash.warning === 'function' ? flash.warning() : flash.warning;
    if (success) legacy.push({ message: success, type: 'success' });
    if (error) legacy.push({ message: error, type: 'error' });
    if (info) legacy.push({ message: info, type: 'info' });
    if (warning) legacy.push({ message: warning, type: 'warning' });

    const list = [...toasts, ...legacy];
    if (list.length === 0) return;

    for (const t of list) {
      const key = JSON.stringify({ m: t?.message, t: t?.type });
      if (!t?.message || seen.current.has(key)) continue;
      seen.current.add(key);
      push(String(t.message), (t.type as any) || 'info');
    }
  }, [
    toasts?.length,
    flash?.success,
    flash?.error,
    flash?.info,
    flash?.warning,
  ]);

  return null;
}
