/**
 * @deprecated Use useRealtimeNotifications instead for better functionality
 * This hook is kept for backward compatibility and is now a thin wrapper
 * around useRealtimeNotifications using the enhanced NotificationProvider.
 */
import { useRealtimeNotifications } from './useRealtimeNotifications';

interface UseNotificationsOptions {
  userId?: number;
  userRoles?: string[];
}

/**
 * Legacy hook for real-time notifications.
 * @deprecated Use useRealtimeNotifications for full functionality
 */
const useNotifications = (userId: number | UseNotificationsOptions) => {
  // Handle both old signature (number) and new signature (object)
  const options: UseNotificationsOptions = typeof userId === 'number'
    ? { userId }
    : userId;

  return useRealtimeNotifications(options);
};

export default useNotifications;
export { useRealtimeNotifications } from './useRealtimeNotifications';
export type { QRScanEvent, MessageEvent } from './useRealtimeNotifications';