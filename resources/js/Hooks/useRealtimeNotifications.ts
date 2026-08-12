import { useEffect, useCallback, useRef } from 'react';
import { useNotification } from '@/Providers/NotificationProvider';

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

interface MessageEvent {
  message: {
    id: number;
    conversation_id: number;
    sender_id: number;
    sender: {
      id: number;
      name: string;
    };
    content: string;
    type: string;
    created_at: string;
  };
}

interface UseRealtimeNotificationsOptions {
  userId?: number;
  userRoles?: string[];
  // Callbacks for custom handling
  onQRScan?: (event: QRScanEvent) => void;
  onMessage?: (event: MessageEvent) => void;
  onScanTagged?: (event: any) => void;
  onAttendanceUpdate?: (event: any) => void;
}

/**
 * Hook to listen for real-time notifications from Laravel Echo broadcasts.
 * Shows popup notifications for:
 * - QR Scans (to control room operators, managers, admins)
 * - New Messages (to conversation participants)
 * - Scan Tagged events (to control room)
 * - Attendance Updates (to relevant parties)
 *
 * Usage in layouts:
 * const { user } = usePage().props.auth;
 * const roles = usePage().props.auth.user?.roles || [];
 * useRealtimeNotifications({ userId: user?.id, userRoles: roles });
 */
export const useRealtimeNotifications = (options: UseRealtimeNotificationsOptions = {}) => {
  const { userId, userRoles = [], onQRScan, onMessage, onScanTagged, onAttendanceUpdate } = options;
  const { pushSuccess, pushInfo, pushWarning } = useNotification();

  // Track subscribed channels for cleanup
  const channelsRef = useRef<Set<string>>(new Set());
  const echoRef = useRef<any>(null);

  const isControlRoomStaff = useCallback(() => {
    const controlRoomRoles = ['control_room_operator', 'operations_officer', 'manager', 'admin', 'super_admin'];
    return userRoles.some(role => controlRoomRoles.includes(role));
  }, [userRoles]);

  // Handle QR Scan events
  const handleQRScanned = useCallback((e: QRScanEvent) => {
    const data = e?.data ?? {} as QRScanEvent['data'];
    const verified = data.location_verified;

    // Show popup notification
    pushSuccess(
      `${data.supervisor_name ?? 'Unknown'} scanned at ${data.site_name ?? 'Unknown site'}`,
      {
        title: verified ? '✅ Checkpoint Verified' : '⚠️ Checkpoint Scan',
        duration: 8000,
        action: {
          label: 'View Dashboard',
          onClick: () => {
            window.location.href = route('control-room.dashboard');
          },
        },
      }
    );

    // Call optional callback
    onQRScan?.(e);
  }, [pushSuccess, onQRScan]);

  // Handle Message events
  const handleMessageSent = useCallback((e: MessageEvent) => {
    const msg = e?.message;
    if (!msg) return;

    // Don't show notification if message is from current user
    if (msg.sender_id === userId) return;

    const isEmergency = msg.type === 'emergency';
    const title = isEmergency ? '🚨 Emergency Message' : `New message from ${msg.sender?.name ?? 'Unknown'}`;
    const content = msg.content?.length > 100 ? msg.content.substring(0, 100) + '...' : msg.content;

    if (isEmergency) {
      pushWarning(content || 'Emergency message received', {
        title,
        duration: 15000, // Emergency messages stay longer
        action: {
          label: 'View Message',
          onClick: () => {
            window.location.href = route('messages.conversations.show', msg.conversation_id);
          },
        },
      });
    } else {
      pushInfo(content || 'New message received', {
        title,
        duration: 6000,
        action: {
          label: 'Reply',
          onClick: () => {
            window.location.href = route('messages.conversations.show', msg.conversation_id);
          },
        },
      });
    }

    onMessage?.(e);
  }, [userId, pushInfo, pushWarning, onMessage]);

  // Handle Scan Tagged events
  const handleScanTagged = useCallback((e: any) => {
    pushInfo('Scan details updated', {
      title: 'Control Room Update',
      duration: 5000,
    });
    onScanTagged?.(e);
  }, [pushInfo, onScanTagged]);

  // Handle Attendance Updated events
  const handleAttendanceUpdated = useCallback((e: any) => {
    const guardName = e?.attendance?.guard?.name ?? 'Guard';
    const status = e?.attendance?.status ?? 'checked in';

    pushSuccess(`${guardName} ${status}`, {
      title: 'Attendance Update',
      duration: 5000,
    });
    onAttendanceUpdate?.(e);
  }, [pushSuccess, onAttendanceUpdate]);

  useEffect(() => {
    const echo = (window as any).Echo;
    if (!echo || typeof echo.private !== 'function') {
      console.warn('RealtimeNotifications: Echo not available');
      return;
    }

    echoRef.current = echo;
    const channels = channelsRef.current;

    // Subscribe to control-room channel (for QR scans, scan tags, attendance)
    // Only for control room staff, managers, admins
    if (isControlRoomStaff()) {
      try {
        const controlRoomChannel = echo.private('control-room');
        controlRoomChannel.listen('QRScanned', handleQRScanned);
        controlRoomChannel.listen('ScanTagged', handleScanTagged);
        controlRoomChannel.listen('AttendanceUpdated', handleAttendanceUpdated);
        channels.add('control-room');
      } catch (err) {
        console.warn('RealtimeNotifications: Failed to subscribe to control-room channel', err);
      }
    }

    // Subscribe to user-specific channel for messages and personal notifications
    if (userId) {
      try {
        const userChannel = echo.private(`user.${userId}`);
        userChannel.listen('MessageSent', handleMessageSent);
        channels.add(`user.${userId}`);
      } catch (err) {
        console.warn('RealtimeNotifications: Failed to subscribe to user channel', err);
      }
    }

    // Cleanup function
    return () => {
      channels.forEach(channelName => {
        try {
          if (channelName === 'control-room') {
            const ch = echo.private('control-room');
            ch?.stopListening('QRScanned');
            ch?.stopListening('ScanTagged');
            ch?.stopListening('AttendanceUpdated');
          } else if (channelName.startsWith('user.')) {
            const ch = echo.private(channelName);
            ch?.stopListening('MessageSent');
          }
          echo.leave(channelName);
        } catch {}
      });
      channels.clear();
    };
  }, [userId, isControlRoomStaff, handleQRScanned, handleMessageSent, handleScanTagged, handleAttendanceUpdated]);

  return {
    isConnected: !!echoRef.current,
    subscribedChannels: Array.from(channelsRef.current),
  };
};

export default useRealtimeNotifications;

// Types re-export
export type { QRScanEvent, MessageEvent, UseRealtimeNotificationsOptions };
