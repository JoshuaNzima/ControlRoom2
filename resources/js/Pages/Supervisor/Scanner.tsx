import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import SupervisorLayout from '@/Layouts/SupervisorLayout';
import { Html5QrcodeScanner } from 'html5-qrcode';

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

  useEffect(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        (error) => {
          console.warn('Location access denied:', error);
        }
      );
    }
  }, []);

  useEffect(() => {
    if (scanning) {
      const scanner = new Html5QrcodeScanner(
        'qr-reader',
        { fps: 10, qrbox: 250 },
        false
      );

      scanner.render(
        (decodedText) => {
          scanner.clear();
          handleScan(decodedText);
        },
        (error) => {
          // Ignore scanning errors
        }
      );

      return () => {
        scanner.clear();
      };
    }
  }, [scanning]);

  const handleScan = (code: string) => {
    setScanning(false);
    const normalized = normalizeCode(code);
    submitScan(normalized);
  };

  const submitScan = (code: string) => {
    router.post(route('checkpoint.scan'), {
      code: code,
      latitude: location?.lat,
      longitude: location?.lon,
    });
  };

  const normalizeCode = (raw: string): string => {
    try {
      // If it's a full URL, extract ?code= or /checkpoint/{code}
      const url = new URL(raw);
      const queryCode = url.searchParams.get('code');
      if (queryCode) return queryCode;
      const parts = url.pathname.split('/').filter(Boolean);
      const checkpointIndex = parts.findIndex(p => p.toLowerCase() === 'checkpoint' || p.toLowerCase() === 'checkpoints');
      if (checkpointIndex !== -1 && parts[checkpointIndex + 1]) {
        return parts[checkpointIndex + 1];
      }
      // Fallback to entire URL string if nothing matched
      return raw;
    } catch {
      // Not a URL, return raw (assume it's the code itself)
      return raw;
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      submitScan(manualCode.trim());
    }
  };

  const clearScan = () => {
    router.post(route('checkpoint.clear'));
  };

  const submitDown = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeScan?.site_id) return;
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
      }
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
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-start justify-between">
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
                  Expires in: {timeRemaining} minutes
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setDownOpen(true)}
                  className="bg-white text-red-600 hover:bg-gray-100 px-4 py-2 rounded-lg font-bold transition"
                >
                  Report Down
                </button>
                <button
                  onClick={clearScan}
                  className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg font-medium transition"
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
          <p className="text-gray-600 mb-6">
            Scan the QR code or NFC tag at the client site to verify your location and lock the site for attendance.
          </p>

          {/* QR Scanner */}
          {!scanning ? (
            <button
              onClick={() => setScanning(true)}
              className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-lg shadow-md transition-all transform hover:scale-105"
            >
              Start QR Scanner
            </button>
          ) : (
            <div className="space-y-4">
              <div id="qr-reader" className="rounded-lg overflow-hidden"></div>
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
              />
              <button
                type="submit"
                disabled={!manualCode.trim()}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition"
              >
                Submit Code
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
                </>
              ) : (
                <>
                  <span className="text-yellow-600">●</span>
                  <span className="text-gray-600">GPS Location: Disabled</span>
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
            <li>2. Scan the QR code or tap the NFC tag</li>
            <li>3. Site will be locked for 2 hours</li>
            <li>4. Take attendance for guards at this site only</li>
            <li>5. System verifies you're at the correct location</li>
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
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Photo (optional)</label>
                  <input type="file" accept="image/*" capture="environment" onChange={(e) => setDownPhoto(e.target.files?.[0] || null)} />
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setDownOpen(false)} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg">Submit</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </SupervisorLayout>
  );
}