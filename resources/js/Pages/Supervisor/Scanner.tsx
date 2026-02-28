import React, { useState, useEffect, useCallback } from 'react';
import { Head, router } from '@inertiajs/react';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface Props {
  activeScan?: {
    site_id: number;
    site_name: string;
    client_name?: string;
    scanned_at: string;
    expires_at: string;
  } | null;
}

export default function Scanner({ activeScan }: Props) {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleScan = useCallback(async (decodedText: string) => {
    if (scanning) return;
    setScanning(true);
    setError(null);
    setSuccess(null);

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
      let payload;
      try {
        payload = JSON.parse(decodedText);
      } catch {
        payload = null;
      }

      const isSiteQR = payload && payload.type === 'site';
      const routeName = isSiteQR ? 'scan.site' : 'scan.checkpoint';

      if (isSiteQR) {
        const siteId = payload?.site_id ?? payload?.site ?? payload?.id;
        router.visit(route(routeName, { site: siteId, latitude, longitude }), {
          onSuccess: () => {
            setSuccess('Site scanned successfully!');
            setScanResult(decodedText);
          },
          onError: (errors) => {
            const msg = (Object.values(errors || {})[0] as string) || 'Scan failed. Please try again.';
            setError(msg);
          },
          onFinish: () => setScanning(false),
        });
        return;
      }

      router.post(route(routeName), {
        code: decodedText,
        latitude,
        longitude,
      }, {
        onSuccess: () => {
          setSuccess('Checkpoint scanned successfully!');
          setScanResult(decodedText);
        },
        onError: (errors) => {
          const msg = (Object.values(errors || {})[0] as string) || 'Scan failed. Please try again.';
          setError(msg);
        },
        onFinish: () => setScanning(false),
      });
    } catch (err) {
      setError('GPS location required. Please enable location services.');
      setScanning(false);
    }
  }, [scanning]);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1
      },
      false
    );

    scanner.render(
      (decodedText) => {
        handleScan(decodedText);
      },
      (errorMessage) => {
        // Ignore scan errors (no QR code in frame)
      }
    );

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [handleScan]);

  const handleClear = () => {
    router.post(route('scan.clear'), {}, {
      onSuccess: () => {
        setSuccess('Scan lock cleared');
        setScanResult(null);
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6">
      <Head title="QR Scanner" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="p-4 sm:p-6 dark:bg-gray-800">
          <h1 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            QR Code Scanner
          </h1>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-200 text-sm">
              {error}
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
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                Scanned: {new Date(activeScan.scanned_at).toLocaleString()}
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
