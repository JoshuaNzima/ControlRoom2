import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import SupervisorLayout from '@/Layouts/SupervisorLayout';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';

interface Props {
  activeScan: {
    scan_id: number;
    site_id: number;
    site_name: string;
    client_name: string;
    scanned_at: string;
    expires_at: string;
  } | null;
}

export default function Scanner({ activeScan }: Props) {
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [location, setLocation] = useState<{lat: number; lon: number} | null>(null);
  const [downOpen, setDownOpen] = useState(false);
  const [downReason, setDownReason] = useState('');
  const [downPhoto, setDownPhoto] = useState<File | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Get user location with better error handling
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

  useEffect(() => {
    if (scanning) {
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
          // Stop scanning and clear the UI immediately
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
          // Ignore regular scanning errors (they happen constantly while searching for QR codes)
        }
      ).catch(error => {
        console.error('Scanner initialization error:', error);
        setCameraError('Failed to start the camera. Please try again or use manual entry.');
        setScanning(false);
      });

      return () => {
        scanner.clear();
      };
    }
  }, [scanning]);

  const handleScan = async (code: string) => {
    setIsLoading(true);
    const normalized = normalizeCode(code);
    
    try {
      await submitScan(normalized);
    } catch (error) {
      console.error('Scan submission error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const submitScan = async (code: string) => {
    router.post(route('checkpoint.scan'), {
      code: code,
      latitude: location?.lat,
      longitude: location?.lon,
    }, {
      preserveState: true,
      onError: (errors) => {
        // Show error message
        const message = Object.values(errors)[0] as string;
        alert(message || 'Failed to process scan. Please try again.');
      }
    });
  };

  const normalizeCode = (raw: string): string => {
    try {
      // Handle both URL formats and direct codes
      if (raw.startsWith('http')) {
        const url = new URL(raw);
        // Handle app-generated QR codes (priority)
        const checkpoint = url.searchParams.get('checkpoint');
        if (checkpoint) return checkpoint;
        
        // Legacy format support
        const code = url.searchParams.get('code');
        if (code) return code;

        // Path-based format
        const parts = url.pathname.split('/').filter(Boolean);
        const checkpointIndex = parts.findIndex(p => 
          p.toLowerCase() === 'checkpoint' || 
          p.toLowerCase() === 'checkpoints'
        );
        if (checkpointIndex !== -1 && parts[checkpointIndex + 1]) {
          return parts[checkpointIndex + 1];
        }
      }
      
      // Assume raw code format (e.g., "CHK-XXXX")
      if (raw.match(/^CHK-[A-Z0-9]+$/i)) {
        return raw.toUpperCase();
      }

      // If nothing matched, return original
      return raw;
    } catch {
      return raw;
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleScan(manualCode.trim());
      setManualCode('');
    }
  };

  const clearScan = () => {
    if (confirm('Are you sure you want to clear this scan?')) {
      router.post(route('checkpoint.clear'));
    }
  };

  const submitDown = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeScan?.site_id) return;
    
    setIsLoading(true);
    const form = new FormData();
    form.append('client_site_id', String(activeScan.site_id));
    if (downReason) form.append('reason', downReason);
    if (downPhoto) form.append('photo', downPhoto);
    
    router.post(route('supervisor.downs.store'), form, {
      forceFormData: true,
      onSuccess: () => {
        setDownOpen(false);
        setDownReason('');
        setDownPhoto(null);
      },
      onError: (errors) => {
        const message = Object.values(errors)[0] as string;
        alert(message || 'Failed to submit report. Please try again.');
      },
      onFinish: () => setIsLoading(false)
    });
  };

  const timeRemaining = activeScan 
    ? Math.max(0, Math.floor((new Date(activeScan.expires_at).getTime() - Date.now()) / 60000))
    : 0;

  return (
    <SupervisorLayout title="Site Scanner">
      <Head title="Scanner" />

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Active Scan Display */}
        {activeScan && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
            {/* Pulse animation in background */}
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
        <div className="bg-white rounded-xl shadow-lg p-6">
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
              <div id="qr-reader" className="rounded-lg overflow-hidden shadow-inner">
                {/* Scanner will mount here */}
              </div>
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
                            console.warn('Location refresh error:', error.message);
                            alert('Failed to refresh location. Please check your GPS settings.');
                          },
                          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
                        );
                      }
                    }}
                    className="text-indigo-600 hover:text-indigo-800 ml-2"
                  >
                    Refresh
                  </button>
                </>
              ) : (
                <>
                  <span className="text-yellow-600">●</span>
                  <span className="text-gray-600">GPS Location: Disabled</span>
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
                          },
                          { enableHighAccuracy: true }
                        );
                      }
                    }}
                    className="text-yellow-600 hover:text-yellow-800 ml-2"
                  >
                    Enable
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-bold text-blue-900 mb-3">How It Works</h3>
          <ol className="space-y-2 text-sm text-blue-800">
            <li>1. Arrive at the client site</li>
            <li>2. Ensure location access is enabled for accurate tracking</li>
            <li>3. Scan the site's QR code or use manual entry</li>
            <li>4. Site will be locked for attendance tracking</li>
            <li>5. Take attendance for guards at this site</li>
          </ol>
        </div>

        {/* Report Down Modal */}
        {downOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl w-11/12 md:w-1/2 p-6">
              <h3 className="text-lg font-bold mb-4">Report Down</h3>
              <form onSubmit={submitDown} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Site</label>
                  <input
                    value={`${activeScan?.client_name ?? ''} - ${activeScan?.site_name ?? ''}`}
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
    </SupervisorLayout>
  );
}