import React, { useState, useEffect, useRef } from 'react';
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

export default function Scanner({ activeScan }: Props) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const processingRef = useRef(false);

  const handleScan = async (decodedText: string) => {
    // Use ref to prevent double-processing (avoids stale closure issues)
    if (processingRef.current) return;
    processingRef.current = true;
    setScanning(true);
    setError(null);
    setSuccess(null);

    // Stop the scanner to prevent further reads
    if (scannerRef.current) {
      try { scannerRef.current.clear(); } catch {}
      scannerRef.current = null;
    }

    const loadingToast = toast.loading('Processing scan...');

    try {
      // Get GPS coordinates
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;

      // Determine if it's a site QR or checkpoint QR
      let payload: any = null;
      try {
        payload = JSON.parse(decodedText);
      } catch {
        payload = null;
      }

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

      // Checkpoint scan
      router.post(route('scan.checkpoint'), {
        code: decodedText,
        latitude,
        longitude,
      }, {
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
      });
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('GPS location required. Please enable location services.', { duration: 6000, icon: '❌' });
      setError('GPS location required. Please enable location services.');
      setScanning(false);
      processingRef.current = false;
    }
  };

  const initScanner = () => {
    // Clean up any existing scanner
    if (scannerRef.current) {
      try { scannerRef.current.clear(); } catch {}
      scannerRef.current = null;
    }

    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1
      },
      false
    );

    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        handleScan(decodedText);
      },
      (_errorMessage) => {
        // Ignore scan errors (no QR code in frame)
      }
    );
  };

  useEffect(() => {
    initScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, []);

  const handleRetry = () => {
    setError(null);
    setSuccess(null);
    processingRef.current = false;
    // Re-initialize scanner after a brief delay to let DOM settle
    setTimeout(() => initScanner(), 100);
  };

  const handleClear = () => {
    const loadingToast = toast.loading('Clearing scan lock...');
    router.post(route('scan.clear'), {}, {
      onSuccess: () => {
        toast.dismiss(loadingToast);
        toast.success('Scan lock cleared', { duration: 3000, icon: '✅' });
        setSuccess('Scan lock cleared');
      },
      onError: () => {
        toast.dismiss(loadingToast);
        toast.error('Failed to clear scan lock', { duration: 4000, icon: '❌' });
      }
    });
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
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                className="mt-2"
              >
                Clear Lock
              </Button>
            </div>
          )}

          <div className="mb-4">
            <div id="qr-reader" className="rounded-lg overflow-hidden" />
          </div>

          {scanning && (
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              Processing scan...
            </div>
          )}

          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            <p className="font-medium mb-2">Instructions:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Point camera at QR code</li>
              <li>Ensure good lighting</li>
              <li>Hold steady until scan completes</li>
              <li>GPS location is required for verification</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
