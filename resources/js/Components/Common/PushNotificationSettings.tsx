import React, { useState } from 'react';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import IconMapper from '@/Components/IconMapper';
import usePushNotifications from '@/Hooks/usePushNotifications';

interface PushNotificationSettingsProps {
  className?: string;
}

export default function PushNotificationSettings({ className = '' }: PushNotificationSettingsProps) {
  const {
    isSupported,
    isSubscribed,
    isPermissionGranted,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    requestPermission,
    testNotification,
  } = usePushNotifications();

  const [showHelp, setShowHelp] = useState(false);

  const handleResetSubscription = async () => {
    if (confirm('This will remove your push notification subscription. You will need to enable notifications again. Continue?')) {
      await unsubscribe();
    }
  };

  if (!isSupported) {
    return (
      <Card className={`bg-white/60 dark:bg-gray-900/40 ${className}`}>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <IconMapper name="Bell" size={20} className="text-coin-600 dark:text-coin-400" />
            Push Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Push notifications are not supported in this browser. Please try Chrome, Firefox, or Edge.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-white/60 dark:bg-gray-900/40 ${className}`}>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <IconMapper name="Bell" size={20} className="text-coin-600 dark:text-coin-400" />
          Push Notifications
        </CardTitle>
        <CardDescription>
          Get instant alerts for incidents, attendance, and important updates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              isSubscribed
                ? 'bg-green-500'
                : isPermissionGranted
                ? 'bg-yellow-500'
                : 'bg-gray-400'
            }`}
          />
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {isSubscribed
              ? 'Notifications enabled'
              : isPermissionGranted
              ? 'Permission granted, click Enable to subscribe'
              : 'Notifications disabled'}
          </span>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2">
          {!isPermissionGranted && !isSubscribed && (
            <Button
              onClick={async () => {
                const granted = await requestPermission();
                if (granted) {
                  await subscribe();
                }
              }}
              disabled={isLoading}
              className="w-full sm:w-auto gap-2"
            >
              {isLoading ? (
                <IconMapper name="Loader2" size={16} className="animate-spin" />
              ) : (
                <IconMapper name="Bell" size={16} />
              )}
              Enable Notifications
            </Button>
          )}

          {isPermissionGranted && !isSubscribed && (
            <Button onClick={subscribe} disabled={isLoading} className="w-full sm:w-auto gap-2">
              {isLoading ? (
                <IconMapper name="Loader2" size={16} className="animate-spin" />
              ) : (
                <IconMapper name="BellPlus" size={16} />
              )}
              Subscribe
            </Button>
          )}

          {isSubscribed && (
            <>
              <Button
                onClick={testNotification}
                variant="outline"
                className="w-full sm:w-auto gap-2"
              >
                <IconMapper name="Send" size={16} />
                Test Notification
              </Button>
              <Button
                onClick={handleResetSubscription}
                variant="ghost"
                className="w-full sm:w-auto gap-2 text-red-600 hover:text-red-700 dark:text-red-400"
              >
                {isLoading ? (
                  <IconMapper name="Loader2" size={16} className="animate-spin" />
                ) : (
                  <IconMapper name="RefreshCw" size={16} />
                )}
                Reset Subscription
              </Button>
            </>
          )}
        </div>

        {/* Help Section */}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => setShowHelp(!showHelp)}
            className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <IconMapper name="HelpCircle" size={14} />
            {showHelp ? 'Hide troubleshooting' : 'Having issues? Click for help'}
          </button>

          {showHelp && (
            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-xs text-gray-600 dark:text-gray-400 space-y-2">
              <p className="font-medium text-gray-700 dark:text-gray-300">Troubleshooting:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Check browser settings: Settings &rarr; Privacy &rarr; Notifications</li>
                <li>Look for a blocked icon in the address bar</li>
                <li>Ensure Do Not Disturb is off on your device</li>
                <li>Click "Reset Subscription" above and try again</li>
              </ul>
              <p className="pt-2 border-t border-gray-200 dark:border-gray-700 mt-2">
                Supported browsers: Chrome, Firefox, Edge, Safari (macOS)
              </p>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Push notifications work even when the app is closed. You can manage your subscription anytime.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
