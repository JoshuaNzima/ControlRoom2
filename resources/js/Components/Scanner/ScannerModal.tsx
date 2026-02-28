import React, { useState, useEffect, useRef, useCallback } from 'react';
import { router } from '@inertiajs/react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import CameraCapture from '@/Components/CameraCapture';
import toast, { Toaster } from 'react-hot-toast';
import IconMapper from '@/Components/IconMapper';

interface ScanResponse {
  success: boolean;
  message: string;
  redirect: string;
  scan: {
    scan_id: number;
    site_id: number;
    site_name: string;
    client_name: string;
    scanned_at: string;
    expires_at: string;
  };
  checkpoint?: {
    id: number;
    name: string;
  };
  location_verified?: boolean;
  distance_meters?: number;
}

interface ScanResult {
  type: 'site' | 'checkpoint';
  name: string;
  clientName?: string;
  locationVerified: boolean;
  timestamp: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  activeScan?: {
    scan_id: number;
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
  const [location, setLocation] = useState<{lat: number; lon: number} | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [downOpen, setDownOpen] = useState(false);
  const [downReason, setDownReason] = useState('');
  const [downPhoto, setDownPhoto] = useState<File | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize audio context for feedback sounds
  useEffect(() => {
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      audioContextRef.current = new AudioContext();
    }
  }, []);

  const playSuccessSound = useCallback(() => {
    if (!audioContextRef.current) return;
    
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
    oscillator.frequency.setValueAtTime(1100, ctx.currentTime + 0.1); // C#6
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  }, []);

  const playErrorSound = useCallback(() => {
    if (!audioContextRef.current) return;
    
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.setValueAtTime(200, ctx.currentTime);
    oscillator.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.3);
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  }, []);

  const triggerHaptic = useCallback((type: 'success' | 'error' | 'light') => {
    if ('vibrate' in navigator) {
      switch (type) {
        case 'success':
          navigator.vibrate([50, 100, 50]);
          break;
        case 'error':
          navigator.vibrate([200, 100, 200]);
          break;
        case 'light':
          navigator.vibrate(50);
          break;
      }
    }
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        (error) => {
          console.warn('Location access error:', error.message);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  }, []);

  // Auto-start scanner once modal opens and we have a location fix
  useEffect(() => {
    if (open && location && !scanning) {
      setScanning(true);
    }
  }, [open, location]);

  useEffect(() => {
    if (scanning && open) {
      try {
        const scanner = new Html5QrcodeScanner(
          'qr-reader',
          { 
            fps: 10,
            qrbox: { width: 250, height: 250 },
            experimentalFeatures: {
              useBarCodeDetectorIfSupported: true
            },
            rememberLastUsedCamera: true,
            aspectRatio: 1.0,
            supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
            showTorchButtonIfSupported: true,
          },
          false
        );

        scanner.render(
          (decodedText) => {
            scanner.clear();
            setScanning(false);
            handleScan(decodedText);
          },
          (error) => {
            if (error.toString().includes('NotAllowedError')) {
              setCameraError('Camera access was denied. Please allow camera access and try again.');
              setScanning(false);
              scanner.clear();
            } else if (error.toString().includes('NotFoundError')) {
              setCameraError('No camera found. Please ensure your device has a working camera.');
              setScanning(false);
              scanner.clear();
            }
          }
        );

        return () => {
          scanner.clear();
        };
      } catch (error) {
        console.error('Scanner initialization error:', error);
        setCameraError('Failed to start the camera. Please try again or use manual entry.');
        setScanning(false);
      }
    }
  }, [scanning, open]);

  const handleScan = async (code: string) => {
    setIsLoading(true);
    const normalized = normalizeCode(code);
    
    try {
      const handled = await submitIfSiteScan(code);
      if (!handled) {
        await submitScan(normalized);
      }
    } catch (error) {
      console.error('Scan submission error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const submitScan = async (code: string) => {
    const loadingToast = toast.loading('Processing scan...');
    
    router.post(route('scan.checkpoint'), {
      code: code,
      latitude: location?.lat,
      longitude: location?.lon,
    }, {
      preserveState: true,
      onSuccess: (page) => {
        toast.dismiss(loadingToast);
        
        // Play success sound and haptic feedback
        playSuccessSound();
        triggerHaptic('success');
        
        // Show success screen with scan details
        const flash = (page.props as any).flash;
        const isLocationVerified = flash?.location_verified ?? true;
        
        setScanResult({
          type: 'checkpoint',
          name: code.substring(0, 20),
          locationVerified: isLocationVerified,
          timestamp: new Date().toISOString(),
        });
        setShowSuccess(true);
        
        // Auto-close after showing success for 2 seconds
        setTimeout(() => {
          onClose();
          router.visit(route('scan.scanner'));
        }, 2000);
      },
      onError: (errors) => {
        toast.dismiss(loadingToast);
        
        // Play error sound and haptic feedback
        playErrorSound();
        triggerHaptic('error');
        
        const message = Object.values(errors)[0] as string;
        const errorMsg = message || 'Failed to process scan. Please try again.';
        
        setScanError(errorMsg);
        toast.error(errorMsg, { duration: 5000 });
      }
    });
  };

  // Try to interpret the raw code as a site scan and visit the site scan endpoint (GET)
  const submitIfSiteScan = async (raw: string): Promise<boolean> => {
    try {
      // JSON payload (our QR generation may embed type/site_id)
      if (raw.trim().startsWith('{')) {
        const obj = JSON.parse(raw);
        const siteId = obj.site_id ?? obj.site ?? obj.id;
        if ((obj.type === 'site' || obj.t === 'site') && siteId) {
          router.visit(route('scan.site', { site: siteId, latitude: location?.lat, longitude: location?.lon }));
          return true;
        }
      }
    } catch {}

    // URL payload containing /site/scan/{id}
    try {
      if (raw.startsWith('http')) {
        const url = new URL(raw);
        const parts = url.pathname.split('/').filter(Boolean);
        const siteIdx = parts.findIndex(p => p.toLowerCase() === 'site' && parts[parts.indexOf(p)+1]?.toLowerCase() === 'scan');
        if (siteIdx !== -1) {
          const idPart = parts[siteIdx + 2];
          if (idPart) {
            router.visit(route('scan.site', { site: idPart, latitude: location?.lat, longitude: location?.lon }));
            return true;
          }
        }
        // query param ?site=<id>
        const siteParam = url.searchParams.get('site');
        if (siteParam) {
          router.visit(route('scan.site', { site: siteParam, latitude: location?.lat, longitude: location?.lon }));
          return true;
        }
      }
    } catch {}

    return false;
  };

  const clearScan = () => {
    const loadingToast = toast.loading('Clearing site lock...');
    
    router.post(route('scan.clear'), {}, {
      preserveState: true,
      onSuccess: () => {
        toast.dismiss(loadingToast);
        toast.success('Site lock cleared');
        onClose();
      },
      onError: () => {
        toast.dismiss(loadingToast);
        toast.error('Failed to clear site lock');
      }
    });
  };

  const normalizeCode = (raw: string): string => {
    try {
      if (raw.startsWith('http')) {
        const url = new URL(raw);
        const checkpoint = url.searchParams.get('checkpoint');
        if (checkpoint) return checkpoint;
        
        const code = url.searchParams.get('code');
        if (code) return code;

        const parts = url.pathname.split('/').filter(Boolean);
        const checkpointIndex = parts.findIndex(p => 
          p.toLowerCase() === 'checkpoint' || 
          p.toLowerCase() === 'checkpoints'
        );
        if (checkpointIndex !== -1 && parts[checkpointIndex + 1]) {
          return parts[checkpointIndex + 1];
        }
      }
      
      if (raw.match(/^CHK-[A-Z0-9]+$/i)) {
        return raw.toUpperCase();
      }

      return raw;
    } catch {
      return raw;
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) {
      toast.error('Location is required to submit manual scan. Please enable GPS and try again.');
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => setLocation({ lat: position.coords.latitude, lon: position.coords.longitude }),
          (err) => {
            console.warn('Location access error:', err.message);
            toast.error('Unable to acquire location.');
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      }
      return;
    }

    if (manualCode.trim()) {
      handleScan(manualCode.trim());
      setManualCode('');
    }
  };

  const timeRemaining = activeScan
    ? Math.max(0, Math.floor((new Date(activeScan.expires_at).getTime() - Date.now()) / 60000))
    : 0;

  if (!open) return null;

  // Success Screen Overlay
  if (showSuccess && scanResult) {
    return (
      <>
        <Toaster position="top-right" />
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 dark:text-gray-100 rounded-xl w-11/12 max-w-md p-8 text-center">
            <div className="mb-6">
              <div className="w-24 h-24 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center animate-bounce">
                <IconMapper name="CheckCircle" size={48} className="text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Scan Successful!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {scanResult.type === 'site' ? 'Site' : 'Checkpoint'} verified and locked
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6 text-left">
              <div className="flex items-center gap-2 mb-2">
                <IconMapper name="MapPin" size={16} className="text-coin-600" />
                <span className="font-medium text-gray-900 dark:text-gray-100">{scanResult.name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className={scanResult.locationVerified ? 'text-green-600' : 'text-yellow-600'}>
                  {scanResult.locationVerified ? '✓ Location verified' : '⚠ Location not verified'}
                </span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {new Date(scanResult.timestamp).toLocaleTimeString()}
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Redirecting to dashboard...
            </p>
          </div>
        </div>
      </>
    );
  }

  // Error Retry Screen
  if (scanError) {
    return (
      <>
        <Toaster position="top-right" />
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 dark:text-gray-100 rounded-xl w-11/12 max-w-md p-8 text-center">
            <div className="mb-6">
              <div className="w-24 h-24 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <IconMapper name="XCircle" size={48} className="text-red-600 dark:text-red-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Scan Failed
            </h2>
            <p className="text-red-600 dark:text-red-400 mb-6">
              {scanError}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setScanError(null);
                  setScanning(true);
                }}
                className="w-full py-3 bg-coin-600 hover:bg-coin-700 text-white rounded-lg font-medium transition"
              >
                Try Again
              </button>
              <button
                onClick={() => {
                  setScanError(null);
                  setScanning(false);
                }}
                className="w-full py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition"
              >
                Use Manual Entry
              </button>
              <button
                onClick={onClose}
                className="w-full py-3 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-lg font-medium transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
    <Toaster position="top-right" />
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 dark:text-gray-100 rounded-xl w-11/12 max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Scan Checkpoint</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Active Scan Display */}
        {activeScan && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white relative overflow-hidden mb-6">
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-white opacity-10 animate-pulse"></div>
            </div>
            
            <div className="relative flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">✓</span>
                  <h3 className="text-xl font-bold">Site Locked</h3>
                </div>
                <p className="text-green-100 text-sm mb-1">Client: {activeScan.client_name}</p>
                <p className="text-lg font-semibold">{activeScan.site_name}</p>
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
                  onClick={clearScan}
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
              <button
                onClick={() => setCameraError(null)}
                className="mt-2 text-sm text-yellow-600 hover:text-yellow-800"
              >
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
                setCameraError(null);
                // Require GPS before starting scanner
                if (!location) {
                  toast.error('Location is required to scan. Please enable GPS and try again.');
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (position) => {
                        setLocation({ lat: position.coords.latitude, lon: position.coords.longitude });
                        toast.success('Location acquired. You can now scan.');
                      },
                      (err) => {
                        console.warn('Location access error:', err.message);
                        toast.error('Unable to acquire location. Please enable location services.');
                      },
                      { enableHighAccuracy: true, timeout: 10000 }
                    );
                  }
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
                onClick={() => setScanning(false)}
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!manualCode.trim() || isLoading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
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
            <div className="flex items-center gap-2 text-sm">
              {location ? (
                <>
                  <span className="text-green-600">●</span>
                  <span className="text-gray-600">GPS Location: Enabled</span>
                  <button
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                          (position) => {
                            setLocation({
                              lat: position.coords.latitude,
                              lon: position.coords.longitude,
                            });
                          },
                          (error) => {
                            console.warn('Location access error:', error.message);
                            alert('Please enable location access in your browser settings.');
                          }
                        );
                      }
                    }}
                    className="text-yellow-600 hover:text-yellow-800 ml-2"
                  >
                    Refresh
                  </button>
                </>
              ) : (
                <>
                  <span className="text-yellow-600">●</span>
                  <span className="text-gray-600">GPS Location: Not Available</span>
                  <button
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                          (position) => {
                            setLocation({
                              lat: position.coords.latitude,
                              lon: position.coords.longitude,
                            });
                          },
                          (error) => {
                            console.warn('Location access error:', error.message);
                            alert('Please enable location access in your browser settings.');
                          }
                        );
                      }
                    }}
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    Enable Location
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 pt-6 border-t bg-blue-50 border border-blue-200 dark:bg-gray-800 dark:border-gray-700 rounded-xl p-6">
            <h3 className="font-bold text-blue-900 mb-3">How It Works</h3>
            <ol className="space-y-2 text-sm text-blue-800">
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
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData();
                if (activeScan) {
                  formData.append('site_id', String(activeScan.site_id));
                }
                if (downReason) formData.append('reason', downReason);
                if (downPhoto) formData.append('photo', downPhoto);
                setIsLoading(true);
                router.post(route('supervisor.downs.store'), formData, {
                  preserveState: true,
                  onSuccess: () => {
                    setDownOpen(false);
                    setDownReason('');
                    setDownPhoto(null);
                    setIsLoading(false);
                  },
                  onError: () => {
                    setIsLoading(false);
                  },
                });
              }} className="space-y-4">
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
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Photo (optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => setDownPhoto(e.target.files?.[0] || null)}
                    disabled={isLoading}
                    className="w-full"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setDownOpen(false)}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg disabled:opacity-50"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Submitting...
                      </>
                    ) : (
                      'Submit'
                    )}
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