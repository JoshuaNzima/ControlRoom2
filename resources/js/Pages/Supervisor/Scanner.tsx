import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Head, router } from '@inertiajs/react';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Html5QrcodeScanner } from 'html5-qrcode';
import toast, { Toaster } from 'react-hot-toast';

interface Props {
  activeScan?: {
    scan_id?: number;
    checkpoint_id?: number;
    checkpoint_name?: string;
    checkpoint_code?: string;
    site_id: number;
    site_name: string;
    client_name?: string;
    scanned_at: string;
    expires_at?: string;
  } | null;
}

const SCANNER_CONTAINER_ID = 'qr-reader-container';
const SCAN_COOLDOWN_MS = 10_000; // 10 second cooldown per QR code
const RECENT_SCANS_CLEANUP_INTERVAL = 30_000; // clean old entries every 30s

export default function Scanner({ activeScan }: Props) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const processingRef = useRef(false);
  const scannerInitLockRef = useRef(false);

  // Track recently scanned QR codes to prevent duplicates.
  // key = decoded text, value = timestamp of last attempt.
  const recentScansRef = useRef<Map<string, number>>(new Map());

  // Periodically purge old entries from the cooldown map so it doesn't grow unbounded.
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      recentScansRef.current.forEach((ts, key) => {
        if (now - ts > SCAN_COOLDOWN_MS) {
          recentScansRef.current.delete(key);
        }
      });
    }, RECENT_SCANS_CLEANUP_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const stopScanner = useCallback(() => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
      } catch {
        // DOM element may already be gone — that's fine
      }
      scannerRef.current = null;
    }
  }, []);

  const initScanner = useCallback(() => {
    if (scannerInitLockRef.current) return;
    scannerInitLockRef.current = true;
    stopScanner();
    setCameraError(null);

    try {
      const container = document.getElementById(SCANNER_CONTAINER_ID);
      if (!container) {
        setTimeout(() => {
          scannerInitLockRef.current = false;
          initScanner();
        }, 200);
        return;
      }

      const scanner = new Html5QrcodeScanner(
        SCANNER_CONTAINER_ID,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true,
          },
          rememberLastUsedCamera: true,
        },
        false,
      );

      scannerRef.current = scanner;

      scanner.render(
        (decodedText) => handleScan(decodedText),
        (errorMessage) => {
          const msg = errorMessage?.toString() || '';
          if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
            setCameraError('Camera access denied. Please allow camera access in your browser settings, then try again. You can also use the "Manual Entry" field below.');
            stopScanner();
          } else if (msg.includes('NotFoundError')) {
            setCameraError('No camera found on this device. Please use a device with a camera, or use the manual entry field below.');
            stopScanner();
          } else if (msg.includes('NotReadableError')) {
            setCameraError((prev) => {
              if (prev?.includes('NotReadableError')) return prev;
              return 'Camera could not be started (NotReadableError). This usually happens when:\n'
                + '• Another app or browser tab is using the camera\n'
                + '• The camera was recently used and not released\n'
                + '• The browser needs a page refresh\n\n'
                + 'Try: 1) Close other tabs/apps using the camera  2) Refresh this page  3) Use "Manual Entry" below';
            });
            stopScanner();
          } else if (msg.includes('OverconstrainedError')) {
            setCameraError('Camera does not meet requirements. Try using the rear-facing camera.');
            stopScanner();
          } else if (msg.includes('Secure') || msg.includes('https') || msg.includes('SSL')) {
            setCameraError('Camera requires a secure connection (HTTPS). Open this page via HTTPS or use the manual entry field below.');
            stopScanner();
          }
        },
      );
    } catch (err) {
      console.warn('Scanner init error:', err);
      setCameraError('Could not start the scanner. Please use Manual Entry below.');
    } finally {
      scannerInitLockRef.current = false;
    }
  }, []);

  const handleScanRef = useRef<(decodedText: string) => Promise<void>>();

  handleScanRef.current = async (decodedText: string) => {
    // Guard: no concurrent processing
    if (processingRef.current) return;
    processingRef.current = true;
    setScanning(true);
    setError(null);
    setSuccess(null);

    // Cooldown check: skip if this exact QR code was scanned within the cooldown window
    const now = Date.now();
    const lastScanned = recentScansRef.current.get(decodedText);
    if (lastScanned && (now - lastScanned < SCAN_COOLDOWN_MS)) {
      const remaining = Math.ceil((SCAN_COOLDOWN_MS - (now - lastScanned)) / 1000);
      toast(`QR code already scanned. Try again in ${remaining}s.`, {
        duration: 3000,
        icon: '⏳',
        id: 'scan-cooldown',
      });
      processingRef.current = false;
      setScanning(false);
      return;
    }
    recentScansRef.current.set(decodedText, now);

    // **CRITICAL FIX**: Stop the camera scanner immediately after decoding.
    // This prevents the same QR code from being re-decoded while the HTTP
    // request is in flight, which caused an infinite scan→error→scan loop.
    stopScanner();

    const loadingToast = toast.loading('Processing scan...');

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude } = position.coords;

      let payload: any = null;
      try { payload = JSON.parse(decodedText); } catch { payload = null; }
      const isSiteQR = payload && (payload.type === 'site' || payload.t === 'site');

      if (isSiteQR) {
        const siteId = payload?.site_id ?? payload?.site ?? payload?.id;
        router.visit(route('scan.site', { site: siteId, latitude, longitude }), {
          onSuccess: () => {
            toast.dismiss(loadingToast);
            toast.success('Site scanned successfully!', { duration: 4000, icon: '✅' });
            setSuccess('Site scanned successfully!');
            processingRef.current = false;
          },
          onError: (errors) => {
            toast.dismiss(loadingToast);
            const msg = (Object.values(errors || {})[0] as string) || 'Scan failed. Please try again.';
            toast.error(msg, { duration: 6000, icon: '❌' });
            setError(msg);
            processingRef.current = false;
          },
          onFinish: () => setScanning(false),
        });
        return;
      }

      router.post(
        route('scan.checkpoint'),
        { code: decodedText, latitude, longitude },
        {
          onSuccess: () => {
            toast.dismiss(loadingToast);
            toast.success('Checkpoint scanned successfully!', { duration: 4000, icon: '✅' });
            setSuccess('Checkpoint scanned successfully!');
            processingRef.current = false;
          },
          onError: (errors) => {
            toast.dismiss(loadingToast);
            const msg = (Object.values(errors || {})[0] as string) || 'Scan failed. Please try again.';
            toast.error(msg, { duration: 6000, icon: '❌' });
            setError(msg);
            processingRef.current = false;
          },
          onFinish: () => setScanning(false),
        },
      );
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('GPS location required. Please enable location services.', { duration: 6000, icon: '❌' });
      setError('GPS location required. Please enable location services.');
      setScanning(false);
      processingRef.current = false;
    }
  };

  const handleScan = useCallback((decodedText: string) => {
    handleScanRef.current?.(decodedText);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => initScanner(), 300);
    return () => {
      clearTimeout(timer);
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRetry = () => {
    setError(null);
    setSuccess(null);
    setCameraError(null);
    processingRef.current = false;
    setTimeout(() => {
      initScanner();
    }, 500);
  };

  const handleClear = () => {
    const loadingToast = toast.loading('Clearing scan lock...');
    router.post(
      route('scan.clear'),
      {},
      {
        onSuccess: () => {
          toast.dismiss(loadingToast);
          toast.success('Scan lock cleared', { duration: 3000, icon: '✅' });
          setSuccess('Scan lock cleared');
        },
        onError: () => {
          toast.dismiss(loadingToast);
          toast.error('Failed to clear scan lock', { duration: 4000, icon: '❌' });
        },
      },
    );
  };

  const timeRemaining = activeScan?.expires_at
    ? Math.max(0, Math.floor((new Date(activeScan.expires_at).getTime() - Date.now()) / 60000))
    : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6">
      <Toaster position="top-right" />
      <Head title="QR Scanner" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="p-4 sm:p-6 dark:bg-gray-800">
          <h1 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            QR Code Scanner
          </h1>

          {cameraError && (
            <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-800 dark:text-yellow-200 text-sm">
              <div className="flex items-start gap-3">
                <span className="text-xl shrink-0 mt-0.5">⚠️</span>
                <div className="space-y-2">
                  <p className="font-semibold">Camera could not start</p>
                  <p className="whitespace-pre-line">{cameraError}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={handleRetry}>
                  Restart Camera
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setCameraError(null)}>
                  Dismiss & Use Manual Entry
                </Button>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-200 text-sm">
              {error}
              <div className="mt-2">
                <Button variant="outline" size="sm" onClick={handleRetry}>
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-200 text-sm">
              {success}
            </div>
          )}

          {activeScan && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Active Scan:</strong> {activeScan.site_name}
                {activeScan.client_name && ` (${activeScan.client_name})`}
                {activeScan.checkpoint_name && (
                  <span className="block text-xs mt-1 text-blue-600 dark:text-blue-300">
                    Checkpoint: {activeScan.checkpoint_name}
                  </span>
                )}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                Scanned: {new Date(activeScan.scanned_at).toLocaleString()}
                {timeRemaining !== null && (
                  <span className={timeRemaining < 15 ? ' text-yellow-600 font-semibold' : ''}>
                    {' '}· Expires in: {timeRemaining} min
                  </span>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={handleClear} className="mt-2">
                Clear Lock
              </Button>
            </div>
          )}

          <div className="mb-4">
            <div id={SCANNER_CONTAINER_ID} className="rounded-lg overflow-hidden" />
          </div>

          {scanning && (
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              Processing scan...
            </div>
          )}

          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <p className="font-medium mb-2">Instructions:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Point camera at QR code</li>
              <li>Ensure good lighting</li>
              <li>Hold steady until scan completes</li>
              <li>GPS location is required for verification</li>
            </ul>
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
              <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Having trouble?</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Use the <strong>Manual Entry</strong> form below to type the checkpoint code directly.
              </p>
            </div>
          </div>

          {/* Manual Entry Section */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Manual Entry</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              If the camera isn't working, you can type the checkpoint code manually.
            </p>
            <div className="flex gap-2">
              <input
                id="manual-code-input"
                type="text"
                placeholder="Enter checkpoint code (e.g., CHK-XXXXXXXXXXXX)"
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-coin-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const code = (e.target as HTMLInputElement).value.trim();
                    if (code) handleScan(code);
                  }
                }}
              />
              <Button onClick={() => {
                const input = document.getElementById('manual-code-input') as HTMLInputElement;
                if (input?.value.trim()) handleScan(input.value.trim());
              }}>
                Submit
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
