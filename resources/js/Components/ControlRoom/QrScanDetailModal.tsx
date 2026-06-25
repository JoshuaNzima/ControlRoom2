import { useEffect, useState } from 'react';
import { X, MapPin, User, Building2, Clock, CheckCircle, XCircle, Navigation, Phone, FileText, Shield } from 'lucide-react';

interface QrScanDetailModalProps {
  isOpen: boolean;
  scanId: number | null;
  onClose: () => void;
  initialData?: ScanDetail | null;
}

interface ScanDetail {
  id: number;
  checkpoint_scan_id: number | null;
  scanned_at: string;
  guard: {
    name: string;
    phone: string | null;
    position: string;
  };
  checkpoint: {
    id: number;
    name: string;
    code: string | null;
    type: string;
    scan_radius_meters: number;
  };
  site: {
    id: number;
    name: string;
    address: string | null;
  };
  client: {
    id: number;
    name: string;
  } | null;
  scan_type: string;
  location: {
    latitude: number | string | null;
    longitude: number | string | null;
    verified: boolean;
    quality: string;
  };
  device_info: string | null;
  notes: string | null;
  tags: Record<string, unknown>;
}

export default function QrScanDetailModal({ isOpen, scanId, onClose, initialData }: QrScanDetailModalProps) {
  const [scanDetail, setScanDetail] = useState<ScanDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use preloaded data if available, otherwise fetch
  useEffect(() => {
    if (!isOpen) {
      setScanDetail(null);
      setError(null);
      return;
    }

    if (initialData && initialData.id === scanId) {
      setScanDetail(initialData);
      setLoading(false);
      setError(null);
      return;
    }

    if (scanId) {
      fetchScanDetail();
    }
  }, [isOpen, scanId, initialData]);

  const fetchScanDetail = async () => {
    if (!scanId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(route('control-room.operations-data.qr-scan-detail', scanId));
      if (!response.ok) throw new Error('Failed to load scan details');
      const data = await response.json();
      setScanDetail(data);
    } catch (err) {
      setError('Failed to load scan details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  };

  const getScanTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      check_in: 'Check In',
      check_out: 'Check Out',
      patrol: 'Patrol',
      inspection: 'Inspection',
    };
    return types[type] || type;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full sm:max-w-lg max-h-[90vh] sm:max-h-[85vh] bg-slate-900 border border-slate-700/50 rounded-t-xl sm:rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700/50 px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${scanDetail?.location.verified ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
              {scanDetail?.location.verified ? (
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400" />
              )}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-white">QR Scan Details</h2>
              <p className="text-xs sm:text-sm text-slate-400">Scan ID: {scanId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors touch-target-min"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)] sm:max-h-[calc(85vh-80px)] p-4 sm:p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-slate-400">{error}</p>
            </div>
          )}

          {scanDetail && !loading && (
            <div className="space-y-4 sm:space-y-6">
              {/* Status Banner */}
              <div className={`rounded-lg p-3 sm:p-4 ${scanDetail.location.verified ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                <div className="flex items-center gap-2">
                  {scanDetail.location.verified ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">Location Verified</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-400" />
                      <span className="text-red-400 font-medium">Location Not Verified</span>
                    </>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  GPS Quality: <span className="capitalize">{scanDetail.location.quality}</span>
                </p>
              </div>

              {/* Guard Info */}
              <div className="bg-slate-800/50 rounded-lg p-3 sm:p-4 border border-slate-700/50">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-red-400" />
                  <h3 className="text-sm font-medium text-white">Personnel</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs text-slate-500">Name</p>
                    <p className="text-sm sm:text-base text-white font-medium truncate">{scanDetail.guard.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Position</p>
                    <p className="text-sm sm:text-base text-slate-300 capitalize">{scanDetail.guard.position}</p>
                  </div>
                  {scanDetail.guard.phone && (
                    <div className="col-span-2">
                      <p className="text-xs text-slate-500">Phone</p>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <p className="text-sm text-slate-300">{scanDetail.guard.phone}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Checkpoint Info */}
              <div className="bg-slate-800/50 rounded-lg p-3 sm:p-4 border border-slate-700/50">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-red-400" />
                  <h3 className="text-sm font-medium text-white">Checkpoint</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs text-slate-500">Name</p>
                    <p className="text-sm sm:text-base text-white font-medium truncate">{scanDetail.checkpoint.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Type</p>
                    <p className="text-sm sm:text-base text-slate-300 uppercase">{scanDetail.checkpoint.type}</p>
                  </div>
                  {scanDetail.checkpoint.code && (
                    <div>
                      <p className="text-xs text-slate-500">Code</p>
                      <p className="text-xs sm:text-sm text-slate-400 font-mono">{scanDetail.checkpoint.code}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-slate-500">Radius</p>
                    <p className="text-sm sm:text-base text-slate-300">{scanDetail.checkpoint.scan_radius_meters}m</p>
                  </div>
                </div>
              </div>

              {/* Site & Client Info */}
              <div className="bg-slate-800/50 rounded-lg p-3 sm:p-4 border border-slate-700/50">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-4 h-4 text-red-400" />
                  <h3 className="text-sm font-medium text-white">Location</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs text-slate-500">Site</p>
                    <p className="text-sm sm:text-base text-white font-medium truncate">{scanDetail.site.name}</p>
                  </div>
                  {scanDetail.client && (
                    <div>
                      <p className="text-xs text-slate-500">Client</p>
                      <p className="text-sm sm:text-base text-slate-300 truncate">{scanDetail.client.name}</p>
                    </div>
                  )}
                  {scanDetail.site.address && (
                    <div className="col-span-2">
                      <p className="text-xs text-slate-500">Address</p>
                      <p className="text-xs sm:text-sm text-slate-400">{scanDetail.site.address}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Location Data */}
              <div className="bg-slate-800/50 rounded-lg p-3 sm:p-4 border border-slate-700/50">
                <div className="flex items-center gap-2 mb-3">
                  <Navigation className="w-4 h-4 text-red-400" />
                  <h3 className="text-sm font-medium text-white">GPS Coordinates</h3>
                </div>
                {scanDetail.location.latitude != null && scanDetail.location.longitude != null ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <p className="text-xs text-slate-500">Latitude</p>
                        <p className="text-xs sm:text-sm text-slate-300 font-mono">{Number(scanDetail.location.latitude).toFixed(6)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Longitude</p>
                        <p className="text-xs sm:text-sm text-slate-300 font-mono">{Number(scanDetail.location.longitude).toFixed(6)}</p>
                      </div>
                    </div>
                    <a
                      href={`https://www.google.com/maps?q=${Number(scanDetail.location.latitude)},${Number(scanDetail.location.longitude)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs sm:text-sm text-red-400 hover:text-red-300 transition-colors"
                    >
                      <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                      View on Google Maps
                    </a>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No GPS data available</p>
                )}
              </div>

              {/* Scan Details */}
              <div className="bg-slate-800/50 rounded-lg p-3 sm:p-4 border border-slate-700/50">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-red-400" />
                  <h3 className="text-sm font-medium text-white">Scan Details</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs text-slate-500">Scan Type</p>
                    <p className="text-sm sm:text-base text-white capitalize">{getScanTypeLabel(scanDetail.scan_type)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Scanned At</p>
                    <p className="text-xs sm:text-sm text-slate-300">{formatDateTime(scanDetail.scanned_at)}</p>
                  </div>
                  {scanDetail.device_info && (
                    <div className="col-span-2">
                      <p className="text-xs text-slate-500">Device Info</p>
                      <p className="text-xs text-slate-400 truncate">{scanDetail.device_info}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {scanDetail.notes && (
                <div className="bg-slate-800/50 rounded-lg p-3 sm:p-4 border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-red-400" />
                    <h3 className="text-sm font-medium text-white">Notes</h3>
                  </div>
                  <p className="text-sm text-slate-300">{scanDetail.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
