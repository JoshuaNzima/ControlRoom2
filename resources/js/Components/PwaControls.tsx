import React, { useEffect, useRef, useState } from 'react';
import { applyUpdate } from '@/pwa';

export default function PwaControls() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const deferredPrompt = useRef<any>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    function onUpdateAvailable() {
      setUpdateAvailable(true);
    }
    function onOffline() { setIsOffline(true); }
    function onOnline() { setIsOffline(false); }

    function onBeforeInstallPrompt(e: any) {
      e.preventDefault();
      deferredPrompt.current = e;
      setCanInstall(true);
    }

    window.addEventListener('pwa:update-available', onUpdateAvailable);
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt as any);

    return () => {
      window.removeEventListener('pwa:update-available', onUpdateAvailable);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt as any);
    };
  }, []);

  const doInstall = async () => {
    const promptEvent = deferredPrompt.current;
    if (!promptEvent) return;
    promptEvent.prompt();
    try {
      await promptEvent.userChoice;
    } finally {
      deferredPrompt.current = null;
      setCanInstall(false);
    }
  };

  const doUpdate = async () => {
    await applyUpdate();
  };

  const doReload = () => window.location.reload();

  const showBar = updateAvailable || isOffline || canInstall;
  if (!showBar) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="rounded-xl shadow-lg border border-emerald-200 bg-white text-gray-800 p-3 flex items-center gap-2">
        {isOffline && (
          <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Offline</span>
        )}
        {updateAvailable && (
          <span className="px-2 py-1 text-xs rounded-full bg-emerald-100 text-emerald-800">Update available</span>
        )}
        {canInstall && (
          <span className="px-2 py-1 text-xs rounded-full bg-indigo-100 text-indigo-800">Installable</span>
        )}
        <div className="h-5 w-px bg-emerald-200 mx-1" />
        <button onClick={doReload} className="px-2 py-1 text-xs rounded bg-gray-100 hover:bg-gray-200">Reload</button>
        {canInstall && (
          <button onClick={doInstall} className="px-2 py-1 text-xs rounded bg-indigo-600 text-white hover:bg-indigo-700">Install</button>
        )}
        {updateAvailable && (
          <button onClick={doUpdate} className="px-2 py-1 text-xs rounded bg-emerald-600 text-white hover:bg-emerald-700">Update</button>
        )}
      </div>
    </div>
  );
}
