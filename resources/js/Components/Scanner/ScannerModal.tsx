import React, { useState, useEffect, useRef, useCallback } from 'react';
import { router } from '@inertiajs/react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import IconMapper from '@/Components/IconMapper';
import useScanner from '@/Hooks/useScanner';
import toast from 'react-hot-toast';

const QR_READER_CONTAINER = 'qr-reader';
const SCAN_COOLDOWN_MS = 10_000; // 10 second cooldown per QR code

interface Props {
  open: boolean;
  onClose: () => void;
  activeScan?: {
    scan_id: number;
    checkpoint_id?: number;
    checkpoint_name?: string;
    checkpoint_code?: string;
    site_id: number;
    site_name: string;
    client_name: string;
    scanned_at: string;
    expires_at: string;
  } | null;
}

export default function ScannerModal({ open, onClose, activeScan }: Props) {
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [downOpen, setDownOpen] = useState(false);
  const [downReason, setDownReason] = useState('');
  const [downPhoto, setDownPhoto] = useState<File | null>(null);
  const [manualNotFound, setManualNotFound] = useState('');

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scanningRef = useRef(false);
  const initLockRef = useRef(false);
  const processingRef = useRef(false); // Prevents concurrent scan processing
  const handleScanRef = useRef<(code: string) => void>();

  // Track recently scanned QR codes to prevent duplicates.
  const recentScansRef = useRef<Map<string, number>>(new Map());

  const {
    location,
    gpsStatus,
    gpsRetryCount,
    isLoading,
    scanResult,
    scanError,
    showSuccess,
    acquireGps,
    handleScan,
    normalizeCode,
    reportNotFound,
    clearScan: clearSiteLock,
    resetScanState,
  } = useScanner({
    onScanSuccess: () => {
      toast.success('Scan successful!', { duration: 3000, icon: '✅' });
      setTimeout(() => onClose(), 2000);
    },
    onScanError: (error) => {
      toast.error(error || 'Scan failed. Please try again.', { duration: 5000, icon: '❌' });
    },
  });

  // Keep the ref updated with the latest handleScan from useScanner
  handleScanRef.current = handleScan;

  const stopScanner = useCallback(() => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
      } catch {
        // DOM may already be gone — ignore
      }
      scannerRef.current = null;
    }
  }, []);

  const startScanner = useCallback(() => {
    if (initLockRef.current) return;
    initLockRef.current = true;

    stopScanner();
    setCameraError(null);

    try {
      const container = document.getElementById(QR_READER_CONTAINER);
      if (!container) {
        setTimeout(() => {
          initLockRef.current = false;
          startScanner();
        }, 200);
        return;
      }

      const scanner = new Html5QrcodeScanner(
        QR_READER_CONTAINER,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true,
          },
          rememberLastUsedCamera: true,
          aspectRatio: 1.0,
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
          showTorchButtonIfSupported: true,
        },
        false,
      );

      scannerRef.current = scanner;

      scanner.render(
        (decodedText) => {
          // --- CRITICAL: Cooldown check BEFORE stopping scanner or processing ---
          // This prevents the same QR from being re-decoded if stopScanner
          // doesn't take effect before the next video frame.
          const now = Date.now();
          const lastScanned = recentScansRef.current.get(decodedText);
          if (lastScanned && (now - lastScanned < SCAN_COOLDOWN_MS)) {
            const remaining = Math.ceil((SCAN_COOLDOWN_MS - (now - lastScanned)) / 1000);
            toast(`QR code already scanned. Try again in ${remaining}s.`, {
              duration: 3000,
              icon: '⏳',
              id: 'scan-cooldown-modal',
            });
            return;
          }
          recentScansRef.current.set(decodedText, now);

          // --- CRITICAL: Lock out concurrent processing ---
          if (processingRef.current) return;
          processingRef.current = true;

          // --- Stop scanner before ANY async work ---
          stopScanner();
          setScanning(false);

          // --- Process the scan ---
          handleScanRef.current?.(decodedText);
        },
        (errorMessage) => {
          const msg = errorMessage?.toString() || '';
          if (msg.includes('NotAllowedError')) {
            setCameraError('Camera access was denied. Please allow camera access and try again.');
            stopScanner();
            setScanning(false);
          } else if (msg.includes('NotFoundError')) {
            setCameraError('No camera found. Please ensure your device has a working camera.');
            stopScanner();
            setScanning(false);
          }
        },
      );
    } catch (error) {
      console.error('Scanner initialization error:', error);
      setCameraError('Failed to start the camera. Please try again or use manual entry.');
      setScanning(false);
    } finally {
      initLockRef.current = false;
    }
  }, [stopScanner]);

  // Auto-start scanner once modal opens and we have a location fix
  useEffect(() => {
    if (open && location && !scanning && !scanningRef.current) {
      scanningRef.current = true;
      setScanning(true);
    }
  }, [open, location, scanning]);

  // Manage scanner lifecycle
  useEffect(() => {
    if (scanning && open) {
      const timer = setTimeout(() => startScanner(), 300);
      return () => {
        clearTimeout(timer);
        scanningRef.current = false;
        stopScanner();
      };
    } else {
      // Reset processing lock when scanning stops for any reason
      processingRef.current = false;
      stopScanner();
    }
  }, [scanning, open, startScanner, stopScanner]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) {
      toast.error('Location is required to submit manual scan. Please enable GPS and try again.');
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          () => acquireGps(),
          () => toast.error('Unable to acquire location.'),
          { enableHighAccuracy: true, timeout: 10000 },
        );
      }
      return;
    }

    if (manualCode.trim()) {
      handleScan(manualCode.trim());
      setManualCode('');
    }
  };

  const handleNotFoundSubmit = () => {
    const name = manualNotFound.trim();
    if (!name) return;
    reportNotFound(name);
    setManualNotFound('');
  };

  const handleClearScan = () => {
    clearSiteLock(() => onClose());
  };

  const timeRemaining = activeScan
    ? Math.max(0, Math.floor((new Date(activeScan.expires_at).getTime() - Date.now()) / 60000))
    : 0;

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-900 dark:text-gray-100 rounded-xl w-11/12 max-w-2xl p-6 max-h-[90vh] overflow-y-auto relative">

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Scan Checkpoint</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>

          {/* Active Scan Display */}
          {activeScan && (
            <div className="bg-green-600 rounded-xl shadow-lg p-6 text-white relative overflow-hidden mb-6">

              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">+</span>
                    <h3 className="text-xl font-bold">Checkpoint Locked</h3>
                  </div>
                  <p className="text-green-100 text-sm mb-1">Client: {activeScan.client_name}</p>
                  <p className="text-lg font-semibold">{activeScan.site_name}</p>
                  {activeScan.checkpoint_name && (
                    <p className="text-green-100 text-sm mt-1">
                      Checkpoint: {activeScan.checkpoint_name}
                    </p>
                  )}
                  <p className="text-green-100 text-sm mt-2">
                    Scanned: {new Date(activeScan.scanned_at).toLocaleTimeString()}
                  </p>
                  <p className="text-green-100 text-sm">
                    <span className={timeRemaining < 15 ? 'text-yellow-300 font-semibold' : ''}>
                      Expires in: {timeRemaining} minutes
                    </span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDownOpen(true)}
                    className="bg-white text-red-600 hover:bg-gray-100 px-4 py-2 rounded-lg font-bold transition disabled:opacity-50"
                    disabled={isLoading}
                  >
                    Report Down
                  </button>
                  <button
                    onClick={handleClearScan}
                    className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg font-medium transition disabled:opacity-50"
                    disabled={isLoading}
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Scanner Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Scan Checkpoint</h2>

            {cameraError && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="font-medium">{cameraError}</span>
                </div>
                <button onClick={() => setCameraError(null)} className="mt-2 text-sm text-yellow-600 hover:text-yellow-800">
                  Dismiss
                </button>
              </div>
            )}

            <p className="text-gray-600 mb-6">
              Scan the QR code at the client site to verify your location and lock the site for attendance.
            </p>

            {/* QR Scanner */}
            {!scanning ? (
              <button
                onClick={() => {
                  // Reset processing lock when user manually starts scanner
                  processingRef.current = false;
                  setCameraError(null);
                  if (!location) {
                    toast.error('Location is required to scan. Please enable GPS and try again.');
                    acquireGps();
                    return;
                  }
                  setScanning(true);
                }}
                disabled={isLoading}
                className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-bold text-lg shadow-md transition-all transform hover:scale-105 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Start QR Scanner
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-4">
                <div id="qr-reader" className="rounded-lg overflow-hidden shadow-inner"></div>
                <button
                  onClick={() => {
                    processingRef.current = false;
                    setScanning(false);
                  }}
                  className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition"
                >
                  Cancel Scanning
                </button>
              </div>
            )}

            {/* Manual Entry */}
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold text-gray-900 mb-3">Manual Entry</h3>
              <form onSubmit={handleManualSubmit} className="space-y-3">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Enter checkpoint code (e.g., CHK-XXXXXXXXXXXX)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!manualCode.trim() || isLoading}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </>
                  ) : (
                    'Submit Code'
                  )}
                </button>
              </form>
            </div>

            {/* Location Status */}
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {gpsStatus === 'acquiring' && (
                    <>
                      <span className="animate-pulse text-yellow-600">●</span>
                      <span className="text-gray-600 dark:text-gray-400">Acquiring GPS...</span>
                      {gpsRetryCount > 0 && (
                        <span className="text-xs text-gray-500">(attempt {gpsRetryCount})</span>
                      )}
                    </>
                  )}
                  {gpsStatus === 'ready' && location && (
                    <>
                      <span className="text-green-600 dark:text-green-400">●</span>
                      <span className="text-gray-600 dark:text-gray-400">GPS Ready</span>
                      {location.accuracy && (
                        <span className="text-xs text-gray-500 dark:text-gray-500">
                          (±{Math.round(location.accuracy)}m)
                        </span>
                      )}
                    </>
                  )}
                  {gpsStatus === 'retrying' && location && (
                    <>
                      <span className="text-yellow-600 dark:text-yellow-400">●</span>
                      <span className="text-gray-600 dark:text-gray-400">GPS Low Accuracy</span>
                      {location.accuracy && (
                        <span className="text-xs text-yellow-600 dark:text-yellow-400">
                          (±{Math.round(location.accuracy)}m - may cause issues)
                        </span>
                      )}
                    </>
                  )}
                  {gpsStatus === 'error' && (
                    <>
                      <span className="text-red-600 dark:text-red-400">●</span>
                      <span className="text-gray-600 dark:text-gray-400">GPS Unavailable</span>
                    </>
                  )}
                </div>
                <button
                  onClick={() => acquireGps()}
                  disabled={gpsStatus === 'acquiring'}
                  className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <IconMapper name="RefreshCw" size={12} className={gpsStatus === 'acquiring' ? 'animate-spin' : ''} />
                  Refresh GPS
                </button>
              </div>
              {location && location.accuracy && location.accuracy > 50 && (
                <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs text-yellow-700 dark:text-yellow-300">
                  ⚠ GPS accuracy is low. For best results, move outdoors and wait 10-30 seconds before scanning.
                </div>
              )}
            </div>

            {/* Site Not Found Fallback */}
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <IconMapper name="MapPin" size={18} className="text-yellow-600" />
                Site Not Found?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                If the QR code is damaged or missing, you can type the site name directly to request manual mapping.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualNotFound}
                  onChange={(e) => setManualNotFound(e.target.value)}
                  placeholder="Type the site name..."
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500"
                  disabled={isLoading}
                />
                <button
                  onClick={handleNotFoundSubmit}
                  disabled={!manualNotFound.trim() || isLoading}
                  className="px-5 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition"
                >
                  Submit
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-6 pt-6 border-t bg-amber-50 border-2 border-amber-200 dark:bg-gray-800 dark:border-yellow-700 rounded-xl p-6">
              <h3 className="font-bold text-amber-900 mb-3">How It Works</h3>
              <ol className="space-y-2 text-sm text-amber-800">
                <li>1. Arrive at the client site</li>
                <li>2. Ensure location access is enabled for accurate tracking</li>
                <li>3. Scan the site's QR code or use manual entry</li>
                <li>4. Site will be locked for attendance tracking</li>
                <li>5. Take attendance for guards at this site</li>
              </ol>
            </div>
          </div>

          {/* Report Down Modal */}
          {downOpen && activeScan && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-900 dark:text-gray-100 rounded-xl w-11/12 md:w-1/2 p-6">
                <h3 className="text-lg font-bold mb-4">Report Down</h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData();
                    if (activeScan) {
                      formData.append('site_id', String(activeScan.site_id));
                    }
                    if (downReason) formData.append('reason', downReason);
                    if (downPhoto) formData.append('photo', downPhoto);
                    router.post(route('supervisor.downs.store'), formData, {
                      preserveState: true,
                      onSuccess: () => {
                        setDownOpen(false);
                        setDownReason('');
                        setDownPhoto(null);
                      },
                    });
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Site</label>
                    <input
                      value={`${activeScan.client_name} - ${activeScan.site_name}`}
                      readOnly
                      className="w-full px-3 py-2 border rounded-lg bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
                    <textarea
                      value={downReason}
                      onChange={(e) => setDownReason(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="e.g., no guard present on site"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Photo (optional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => setDownPhoto(e.target.files?.[0] || null)}
                      className="w-full"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setDownOpen(false)}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2">
                      Submit
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
