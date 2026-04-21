import { useState, useEffect, useCallback } from 'react';
import { router } from '@inertiajs/react';

interface PushSubscriptionState {
  isSupported: boolean;
  isSubscribed: boolean;
  isPermissionGranted: boolean;
  isLoading: boolean;
  error: string | null;
}

interface UsePushNotificationsReturn extends PushSubscriptionState {
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  requestPermission: () => Promise<boolean>;
  testNotification: () => Promise<void>;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [state, setState] = useState<PushSubscriptionState>({
    isSupported: false,
    isSubscribed: false,
    isPermissionGranted: false,
    isLoading: false,
    error: null,
  });

  // Check if push notifications are supported
  useEffect(() => {
    const isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
    const isPermissionGranted = Notification.permission === 'granted';

    setState((prev) => ({
      ...prev,
      isSupported,
      isPermissionGranted,
    }));

    if (isSupported) {
      checkSubscription();
    }
  }, []);

  // Check existing subscription
  const checkSubscription = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      setState((prev) => ({
        ...prev,
        isSubscribed: !!subscription,
      }));
    } catch (error) {
      console.error('Failed to check subscription:', error);
    }
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      setState((prev) => ({ ...prev, error: 'Push notifications not supported' }));
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      const isPermissionGranted = permission === 'granted';

      setState((prev) => ({
        ...prev,
        isPermissionGranted,
        error: isPermissionGranted ? null : 'Permission denied',
      }));

      return isPermissionGranted;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: 'Failed to request permission',
      }));
      return false;
    }
  }, [state.isSupported]);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      setState((prev) => ({ ...prev, error: 'Push notifications not supported' }));
      return false;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Request permission if not granted
      if (!state.isPermissionGranted) {
        const granted = await requestPermission();
        if (!granted) {
          setState((prev) => ({ ...prev, isLoading: false }));
          return false;
        }
      }

      // Get VAPID public key
      const vapidResponse = await fetch(route('push.vapid'));
      const { publicKey } = await vapidResponse.json();

      if (!publicKey) {
        throw new Error('VAPID public key not configured');
      }

      // Register service worker
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push manager
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // Send subscription to server
      const response = await fetch(route('push.subscribe'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': (window as any).csrfToken || '',
          'Accept': 'application/json',
        },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (!response.ok) {
        throw new Error('Failed to save subscription');
      }

      setState((prev) => ({
        ...prev,
        isSubscribed: true,
        isLoading: false,
      }));

      return true;
    } catch (error) {
      console.error('Failed to subscribe:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to subscribe',
      }));
      return false;
    }
  }, [state.isSupported, state.isPermissionGranted, requestPermission]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      return false;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from push manager
        await subscription.unsubscribe();

        // Notify server
        await fetch(route('push.unsubscribe'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': (window as any).csrfToken || '',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
          }),
        });
      }

      setState((prev) => ({
        ...prev,
        isSubscribed: false,
        isLoading: false,
      }));

      return true;
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Failed to unsubscribe',
      }));
      return false;
    }
  }, [state.isSupported]);

  // Test notification
  const testNotification = useCallback(async (): Promise<void> => {
    if (!state.isSubscribed) {
      setState((prev) => ({ ...prev, error: 'Not subscribed to notifications' }));
      return;
    }

    try {
      const response = await fetch(route('push.test'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': (window as any).csrfToken || '',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to send test notification');
      }
    } catch (error) {
      console.error('Failed to send test notification:', error);
      setState((prev) => ({
        ...prev,
        error: 'Failed to send test notification',
      }));
    }
  }, [state.isSubscribed]);

  return {
    ...state,
    subscribe,
    unsubscribe,
    requestPermission,
    testNotification,
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray.buffer;
}

export default usePushNotifications;
