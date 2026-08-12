import { useState, useEffect, useRef, useCallback } from 'react';
import { router } from '@inertiajs/react';
import toast from 'react-hot-toast';

export interface ActiveScan {
  scan_id: number;
  checkpoint_id?: number;
  checkpoint_name?: string;
  checkpoint_code?: string;
  site_id: number;
  site_name: string;
  client_name: string;
  scanned_at: string;
  expires_at: string;
}

interface ScanLocation {
  lat: number;
  lon: number;
  accuracy: number | null;
}

export interface ScanResult {
  type: 'site' | 'checkpoint';
  name: string;
  checkpointName?: string;
  siteName?: string;
  clientName?: string;
  locationVerified: boolean;
  timestamp: string;
}

type GpsStatus = 'acquiring' | 'ready' | 'retrying' | 'error';

interface UseScannerOptions {
  onScanSuccess?: (result: ScanResult) => void;
  onScanError?: (error: string) => void;
  clearRoute?: string;
  reportNotFoundRoute?: string;
}

/**
 * Shared scanner hook extracted from ScannerModal.tsx.
 * Provides GPS acquisition, QR code normalization, scan submission,
 * and audio/haptic feedback.
 */
export default function useScanner(options: UseScannerOptions = {}) {
  const {
    onScanSuccess,
    onScanError,
    clearRoute = 'scan.clear',
    reportNotFoundRoute = 'scan.report-not-found',
  } = options;

  // GPS state
  const [location, setLocation] = useState<ScanLocation | null>(null);
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('acquiring');
  const [gpsRetryCount, setGpsRetryCount] = useState(0);

  // Scan state
  const [isLoading, setIsLoading] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Audio refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const gpsWatchIdRef = useRef<number | null>(null);

  // Initialize audio context
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
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
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
        case 'success': navigator.vibrate([50, 100, 50]); break;
        case 'error': navigator.vibrate([200, 100, 200]); break;
        case 'light': navigator.vibrate(50); break;
      }
    }
  }, []);

  /**
   * Acquire GPS position with retry logic for good accuracy.
   */
  const acquireGps = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsStatus('error');
      return;
    }

    const maxRetries = 3;
    const maxAccuracy = 100;
    let attempts = 0;
    let bestPosition: { lat: number; lon: number; accuracy: number } | null = null;

    setGpsStatus('acquiring');

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const accuracy = position.coords.accuracy || 999;
        attempts++;
        setGpsRetryCount(attempts);

        if (!bestPosition || accuracy < bestPosition.accuracy) {
          bestPosition = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            accuracy,
          };
        }

        if (accuracy <= maxAccuracy || attempts >= maxRetries) {
          if (gpsWatchIdRef.current !== null) {
            navigator.geolocation.clearWatch(gpsWatchIdRef.current);
            gpsWatchIdRef.current = null;
          }
          setLocation(bestPosition);
          setGpsStatus(accuracy <= maxAccuracy ? 'ready' : 'retrying');
        }
      },
      () => {
        setGpsStatus('error');
        if (gpsWatchIdRef.current !== null) {
          navigator.geolocation.clearWatch(gpsWatchIdRef.current);
          gpsWatchIdRef.current = null;
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );

    gpsWatchIdRef.current = watchId;

    setTimeout(() => {
      if (gpsWatchIdRef.current === watchId) {
        navigator.geolocation.clearWatch(watchId);
        gpsWatchIdRef.current = null;
        if (bestPosition) {
          setLocation(bestPosition);
          setGpsStatus(bestPosition.accuracy <= maxAccuracy ? 'ready' : 'retrying');
        } else {
          setGpsStatus('error');
        }
      }
    }, 15000);
  }, []);

  useEffect(() => {
    acquireGps();
    return () => {
      if (gpsWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(gpsWatchIdRef.current);
        gpsWatchIdRef.current = null;
      }
    };
  }, [acquireGps]);

  /**
   * Normalize a scanned code to its canonical form.
   * Handles JSON payloads, URLs, and raw checkpoint codes.
   */
  const normalizeCode = useCallback((raw: string): string => {
    try {
      if (raw.trim().startsWith('{')) {
        const obj = JSON.parse(raw);
        if ((obj.type === 'checkpoint' || obj.t === 'checkpoint') && obj.code) {
          return obj.code;
        }
      }

      if (raw.startsWith('http')) {
        const url = new URL(raw);
        const checkpoint = url.searchParams.get('checkpoint');
        if (checkpoint) return checkpoint;
        const code = url.searchParams.get('code');
        if (code) return code;
        const parts = url.pathname.split('/').filter(Boolean);
        const checkpointIndex = parts.findIndex(
          (p) => p.toLowerCase() === 'checkpoint' || p.toLowerCase() === 'checkpoints'
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
  }, []);

  /**
   * Submit a checkpoint scan.
   */
  const submitScan = useCallback(
    (code: string) => {
      const loadingToast = toast.loading('Processing scan...');

      router.post(
        route('scan.checkpoint'),
        {
          code,
          latitude: location?.lat,
          longitude: location?.lon,
          accuracy: location?.accuracy,
        },
        {
          preserveState: true,
          onSuccess: (page: any) => {
            toast.dismiss(loadingToast);
            playSuccessSound();
            triggerHaptic('success');
            toast.success('Checkpoint scanned successfully!', { duration: 3000, icon: '✅' });

            const props = page.props as Record<string, any>;
            const flash = props.flash;
            const isLocationVerified = flash?.location_verified ?? true;
            const scanData = props.scan || flash?.scan;

            const result: ScanResult = {
              type: 'checkpoint',
              name: scanData?.checkpoint_name || scanData?.site_name || code.substring(0, 20),
              checkpointName: scanData?.checkpoint_name,
              siteName: scanData?.site_name,
              clientName: scanData?.client_name,
              locationVerified: isLocationVerified,
              timestamp: new Date().toISOString(),
            };

            setScanResult(result);
            setShowSuccess(true);
            onScanSuccess?.(result);
          },
          onError: (errors: Record<string, string>) => {
            toast.dismiss(loadingToast);
            playErrorSound();
            triggerHaptic('error');
            const message = Object.values(errors)[0] as string;
            const errorMsg = message || 'Failed to process scan. Please try again.';
            setScanError(errorMsg);
            toast.error(errorMsg, { duration: 6000, icon: '❌' });
            onScanError?.(errorMsg);
          },
        }
      );
    },
    [location, playSuccessSound, playErrorSound, triggerHaptic, onScanSuccess, onScanError]
  );

  /**
   * Try to interpret a raw QR code as a site scan. Returns true if handled.
   */
  const submitIfSiteScan = useCallback(
    async (raw: string): Promise<boolean> => {
      let siteId: string | number | null = null;
      let siteName: string | null = null;

      try {
        if (raw.trim().startsWith('{')) {
          const obj = JSON.parse(raw);
          siteId = obj.site_id ?? obj.site ?? obj.id;
          siteName = obj.site_name ?? obj.name ?? null;
          if (!((obj.type === 'site' || obj.t === 'site') && siteId)) {
            siteId = null;
          }
        }
      } catch {}

      if (!siteId) {
        try {
          if (raw.startsWith('http')) {
            const url = new URL(raw);
            const parts = url.pathname.split('/').filter(Boolean);
            const siteIdx = parts.findIndex(
              (p) => p.toLowerCase() === 'site' && parts[parts.indexOf(p) + 1]?.toLowerCase() === 'scan'
            );
            if (siteIdx !== -1) {
              const idPart = parts[siteIdx + 2];
              if (idPart) siteId = idPart;
            }
            if (!siteId) {
              const siteParam = url.searchParams.get('site');
              if (siteParam) siteId = siteParam;
            }
          }
        } catch {}
      }

      if (!siteId) return false;

      const loadingToast = toast.loading('Processing site scan...');

      router.visit(
        route('scan.site', {
          site: siteId,
          latitude: location?.lat,
          longitude: location?.lon,
        }),
        {
          onSuccess: (page: any) => {
            toast.dismiss(loadingToast);
            playSuccessSound();
            triggerHaptic('success');
            toast.success('Site scanned successfully!', { duration: 3000, icon: '✅' });

            const props = page.props as Record<string, any>;
            const flash = props.flash;
            const scanData = props.scan;

            const result: ScanResult = {
              type: 'site',
              name: siteName || scanData?.site_name || flash?.scan_success || `Site #${siteId}`,
              siteName: siteName || scanData?.site_name,
              clientName: scanData?.client_name,
              locationVerified: flash?.location_verified ?? true,
              timestamp: new Date().toISOString(),
            };

            setScanResult(result);
            setShowSuccess(true);
            onScanSuccess?.(result);
          },
          onError: (errors: Record<string, string>) => {
            toast.dismiss(loadingToast);
            playErrorSound();
            triggerHaptic('error');
            const message = Object.values(errors)[0] as string;
            const errorMsg = message || 'Failed to process site scan. Please try again.';
            setScanError(errorMsg);
            toast.error(errorMsg, { duration: 6000, icon: '❌' });
            onScanError?.(errorMsg);
          },
        }
      );

      return true;
    },
    [location, playSuccessSound, playErrorSound, triggerHaptic, onScanSuccess, onScanError]
  );

  /**
   * Handle a scanned code — try as site scan first, then fall back to checkpoint.
   */
  const handleScan = useCallback(
    async (code: string) => {
      setIsLoading(true);
      setScanError(null);
      const normalized = normalizeCode(code);

      try {
        const handled = await submitIfSiteScan(code);
        if (!handled) {
          submitScan(normalized);
        }
      } catch (error) {
        console.error('Scan submission error:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [normalizeCode, submitIfSiteScan, submitScan]
  );

  /**
   * Submit a "site not found" report for control room mapping.
   */
  const reportNotFound = useCallback(
    (siteName: string) => {
      if (!siteName.trim()) return;
      if (!location) {
        toast.error('Location is required. Please enable GPS.');
        return;
      }
      setIsLoading(true);
      router.post(
        route(reportNotFoundRoute),
        {
          site_name: siteName,
          latitude: location.lat,
          longitude: location.lon,
          accuracy: location.accuracy,
        },
        {
          preserveState: true,
          onSuccess: () => {
            toast.success(`"${siteName}" reported. Control room will map it.`, {
              duration: 5000,
              icon: '📋',
            });
            setIsLoading(false);
          },
          onError: () => {
            toast.error('Failed to submit. Please try again.');
            setIsLoading(false);
          },
        }
      );
    },
    [location, reportNotFoundRoute]
  );

  /**
   * Clear the active site scan lock.
   */
  const clearScan = useCallback(
    (onCleared?: () => void) => {
      const loadingToast = toast.loading('Clearing site lock...');
      router.post(
        route(clearRoute),
        {},
        {
          preserveState: true,
          onSuccess: () => {
            toast.dismiss(loadingToast);
            toast.success('Site lock cleared');
            onCleared?.();
          },
          onError: () => {
            toast.dismiss(loadingToast);
            toast.error('Failed to clear site lock');
          },
        }
      );
    },
    [clearRoute]
  );

  const resetScanState = useCallback(() => {
    setScanResult(null);
    setScanError(null);
    setShowSuccess(false);
    setIsLoading(false);
  }, []);

  return {
    // GPS
    location,
    gpsStatus,
    gpsRetryCount,
    acquireGps,

    // Scan state
    isLoading,
    scanResult,
    scanError,
    showSuccess,
    isLocationReady: location !== null && gpsStatus !== 'error',

    // Actions
    handleScan,
    submitScan,
    submitIfSiteScan,
    normalizeCode,
    reportNotFound,
    clearScan,
    resetScanState,

    // Feedback
    playSuccessSound,
    playErrorSound,
    triggerHaptic,
  };
}
