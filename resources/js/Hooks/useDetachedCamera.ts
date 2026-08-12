import { useCallback, useEffect, useRef, useState } from 'react';

interface DetachedWindow {
  window: Window;
  cameraId: string | number;
  cleanup: () => void;
}

export function useDetachedCamera() {
  const [detachedWindows, setDetachedWindows] = useState<Map<string | number, DetachedWindow>>(new Map());
  const windowsRef = useRef<Map<string | number, DetachedWindow>>(new Map());

  // Sync ref with state
  useEffect(() => {
    windowsRef.current = detachedWindows;
  }, [detachedWindows]);

  const detachCamera = useCallback((camera: {
    id: string | number;
    name?: string;
    stream_url?: string;
    status?: string | null;
  }) => {
    // Check if already detached
    if (windowsRef.current.has(camera.id)) {
      const existing = windowsRef.current.get(camera.id);
      if (existing && !existing.window.closed) {
        existing.window.focus();
        return;
      }
    }

    const width = 640;
    const height = 480;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    const popup = window.open(
      '',
      `camera-${camera.id}`,
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=no,status=no,toolbar=no,menubar=no,location=no`
    );

    if (!popup) {
      alert('Please allow popups to detach camera windows');
      return;
    }

    // Create the detached window HTML content
    const cameraName = camera.name || `Camera ${camera.id}`;
    const streamUrl = camera.stream_url || '';

    popup.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${cameraName} - Live Feed</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            background: #0a0a0a;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            height: 100vh;
          }
          .header {
            background: linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%);
            color: white;
            padding: 8px 12px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 14px;
            font-weight: 500;
          }
          .header-actions {
            display: flex;
            gap: 8px;
          }
          .btn {
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            transition: background 0.2s;
          }
          .btn:hover { background: rgba(255,255,255,0.3); }
          .video-container {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #000;
            position: relative;
          }
          video {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
          }
          .offline {
            color: #666;
            font-size: 16px;
          }
          .status-indicator {
            position: absolute;
            top: 10px;
            left: 10px;
            display: flex;
            align-items: center;
            gap: 6px;
            background: rgba(0,0,0,0.7);
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            color: #fff;
          }
          .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #22c55e;
          }
          .status-dot.offline { background: #ef4444; }
        </style>
      </head>
      <body>
        <div class="header">
          <span>${cameraName}</span>
          <div class="header-actions">
            <button class="btn" onclick="toggleFullscreen()">Fullscreen</button>
            <button class="btn" onclick="window.close()">Close</button>
          </div>
        </div>
        <div class="video-container">
          ${streamUrl ? `
            <div class="status-indicator">
              <span class="status-dot ${camera.status === 'online' ? '' : 'offline'}"></span>
              <span>${camera.status === 'online' ? 'LIVE' : 'OFFLINE'}</span>
            </div>
            <video id="video" autoplay playsinline muted></video>
          ` : '<div class="offline">No stream URL configured</div>'}
        </div>
        <script>
          function toggleFullscreen() {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen();
            } else {
              document.exitFullscreen();
            }
          }
          
          // Handle video stream
          const streamUrl = '${streamUrl}';
          const video = document.getElementById('video');
          
          if (streamUrl && video) {
            // Try HLS.js first
            if (window.Hls && window.Hls.isSupported() && streamUrl.includes('.m3u8')) {
              const hls = new window.Hls();
              hls.loadSource(streamUrl);
              hls.attachMedia(video);
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
              // Native HLS support (Safari)
              video.src = streamUrl;
            } else {
              // Fallback to direct URL
              video.src = streamUrl;
            }
            
            // Auto-retry on error
            video.addEventListener('error', function() {
              setTimeout(function() {
                video.load();
                video.play().catch(function(){});
              }, 5000);
            });
          }
          
          // Keep window on top functionality (notify parent)
          window.addEventListener('beforeunload', function() {
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage({ type: 'camera-detached-closed', cameraId: '${camera.id}' }, '*');
            }
          });
          
          // Request HLS.js from parent if needed
          if (streamUrl.includes('.m3u8') && !window.Hls && window.opener) {
            window.opener.postMessage({ type: 'request-hls-js' }, '*');
          }
        </script>
      </body>
      </html>
    `);

    popup.document.close();

    // Load HLS.js if needed
    if (streamUrl.includes('.m3u8')) {
      const hlsScript = popup.document.createElement('script');
      hlsScript.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
      popup.document.head.appendChild(hlsScript);
    }

    const cleanup = () => {
      if (popup && !popup.closed) {
        popup.close();
      }
      setDetachedWindows(prev => {
        const next = new Map(prev);
        next.delete(camera.id);
        return next;
      });
    };

    const detachedWindow: DetachedWindow = {
      window: popup,
      cameraId: camera.id,
      cleanup,
    };

    setDetachedWindows(prev => {
      const next = new Map(prev);
      next.set(camera.id, detachedWindow);
      return next;
    });

    // Monitor window closure
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        cleanup();
      }
    }, 1000);

  }, []);

  const closeDetached = useCallback((cameraId: string | number) => {
    const detached = windowsRef.current.get(cameraId);
    if (detached) {
      detached.cleanup();
    }
  }, []);

  const closeAllDetached = useCallback(() => {
    windowsRef.current.forEach((detached) => {
      detached.cleanup();
    });
  }, []);

  // Listen for messages from detached windows
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'camera-detached-closed') {
        setDetachedWindows(prev => {
          const next = new Map(prev);
          next.delete(event.data.cameraId);
          return next;
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      closeAllDetached();
    };
  }, [closeAllDetached]);

  return {
    detachCamera,
    closeDetached,
    closeAllDetached,
    detachedCount: detachedWindows.size,
    isDetached: useCallback((cameraId: string | number) => detachedWindows.has(cameraId), [detachedWindows]),
  };
}

export default useDetachedCamera;
