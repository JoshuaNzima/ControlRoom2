import { useEffect, useState } from 'react';
import { X, MapPin, Building2, Clock, CheckCircle, XCircle, Navigation, Shield, Calendar, User, Activity } from 'lucide-react';

interface CheckpointDetailModalProps {
  isOpen: boolean;
  checkpointId: number | null;
  onClose: () => void;
}

interface CheckpointInfo {
  id: number;
  name: string;
  code: string;
  type: string;
  description: string | null;
  is_active: boolean;
  requires_photo: boolean;
  scan_radius_meters: number;
  latitude: number | null;
  longitude: number | null;
  site: {
    id: number;
    name: string;
    address: string | null;
    status: string;
  };
  client: {
    id: number;
    name: string;
  } | null;
  zone: {
    id: number;
    name: string;
  } | null;
  stats: {
    today_scans: number;
    week_scans: number;
    last_scan_at: string | null;
    last_scan_by: string | null;
  };
}

interface ScanHistory {
  id: number;
  scanned_at: string;
  supervisor_name: string;
  latitude: number | null;
  longitude: number | null;
  location_verified: boolean;
  device_info: string | null;
}

export default function CheckpointDetailModal({ isOpen, checkpointId, onClose }: CheckpointDetailModalProps) {
  const [checkpointInfo, setCheckpointInfo] = useState<CheckpointInfo | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'history'>('info');

  useEffect(() => {
    if (isOpen && checkpointId) {
      fetchCheckpointData();
    }
    return () => {
      setCheckpointInfo(null);
      setScanHistory([]);
      setError(null);
      setActiveTab('info');
    };
  }, [isOpen, checkpointId]);

  const fetchCheckpointData = async () => {
    if (!checkpointId) return;
    setLoading(true);
    setError(null);
    try {
      const [infoRes, historyRes] = await Promise.all([
        fetch(route('control-room.operations-data.checkpoint-info', checkpointId)),
        fetch(route('control-room.operations-data.checkpoint-scans', checkpointId)),
      ]);

      if (!infoRes.ok) throw new Error('Failed to load checkpoint info');
      const infoData = await infoRes.json();
      setCheckpointInfo(infoData);

      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setScanHistory(historyData.scans || []);
      }
    } catch (err) {
      setError('Failed to load checkpoint details');
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-2xl max-h-[90vh] sm:max-h-[85vh] bg-slate-900 border border-slate-700/50 rounded-t-xl sm:rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700/50 px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/20">
              <Shield className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-white">
                {checkpointInfo?.name || 'Checkpoint Details'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                {checkpointInfo?.code && <span className="font-mono">{checkpointInfo.code}</span>}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors touch-target-min"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="sticky top-[60px] sm:top-[72px] bg-slate-900 border-b border-slate-700/50 px-4 py-2 flex gap-2">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              activeTab === 'info'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            Info
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              activeTab === 'history'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            Scan History ({scanHistory.length})
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] sm:max-h-[calc(85vh-120px)] p-4 sm:p-6">
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

          {checkpointInfo && !loading && activeTab === 'info' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Status Banner */}
              <div className={`rounded-lg p-3 sm:p-4 ${checkpointInfo.is_active ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-slate-700/50 border border-slate-600/30'}`}>
                <div className="flex items-center gap-2">
                  {checkpointInfo.is_active ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">Active</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-400 font-medium">Inactive</span>
                    </>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                  <p className="text-xs text-slate-500">Today</p>
                  <p className="text-xl sm:text-2xl font-bold text-white">{checkpointInfo.stats.today_scans}</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                  <p className="text-xs text-slate-500">This Week</p>
                  <p className="text-xl sm:text-2xl font-bold text-white">{checkpointInfo.stats.week_scans}</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 col-span-2">
                  <p className="text-xs text-slate-500">Last Scan</p>
                  <p className="text-sm font-medium text-white truncate">
                    {checkpointInfo.stats.last_scan_by || 'No scans yet'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatDateTime(checkpointInfo.stats.last_scan_at)}
                  </p>
                </div>
              </div>

              {/* Checkpoint Details */}
              <div className="bg-slate-800/50 rounded-lg p-3 sm:p-4 border border-slate-700/50">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-red-400" />
                  <h3 className="text-sm font-medium text-white">Checkpoint Details</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs text-slate-500">Type</p>
                    <p className="text-sm sm:text-base text-white uppercase">{checkpointInfo.type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Scan Radius</p>
                    <p className="text-sm sm:text-base text-slate-300">{checkpointInfo.scan_radius_meters}m</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Requires Photo</p>
                    <p className="text-sm sm:text-base text-slate-300">{checkpointInfo.requires_photo ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Code</p>
                    <p className="text-xs sm:text-sm text-slate-400 font-mono truncate">{checkpointInfo.code}</p>
                  </div>
                  {checkpointInfo.description && (
                    <div className="col-span-2">
                      <p className="text-xs text-slate-500">Description</p>
                      <p className="text-sm text-slate-300">{checkpointInfo.description}</p>
                    </div>
                  )}
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
                    <p className="text-sm sm:text-base text-white font-medium truncate">{checkpointInfo.site.name}</p>
                  </div>
                  {checkpointInfo.client && (
                    <div>
                      <p className="text-xs text-slate-500">Client</p>
                      <p className="text-sm sm:text-base text-slate-300 truncate">{checkpointInfo.client.name}</p>
                    </div>
                  )}
                  {checkpointInfo.zone && (
                    <div>
                      <p className="text-xs text-slate-500">Zone</p>
                      <p className="text-sm sm:text-base text-slate-300">{checkpointInfo.zone.name}</p>
                    </div>
                  )}
                  {checkpointInfo.site.address && (
                    <div className="col-span-2">
                      <p className="text-xs text-slate-500">Address</p>
                      <p className="text-xs sm:text-sm text-slate-400">{checkpointInfo.site.address}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* GPS Location */}
              <div className="bg-slate-800/50 rounded-lg p-3 sm:p-4 border border-slate-700/50">
                <div className="flex items-center gap-2 mb-3">
                  <Navigation className="w-4 h-4 text-red-400" />
                  <h3 className="text-sm font-medium text-white">GPS Location</h3>
                </div>
                {checkpointInfo.latitude && checkpointInfo.longitude ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <p className="text-xs text-slate-500">Latitude</p>
                        <p className="text-xs sm:text-sm text-slate-300 font-mono">{checkpointInfo.latitude.toFixed(6)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Longitude</p>
                        <p className="text-xs sm:text-sm text-slate-300 font-mono">{checkpointInfo.longitude.toFixed(6)}</p>
                      </div>
                    </div>
                    <a
                      href={`https://www.google.com/maps?q=${checkpointInfo.latitude},${checkpointInfo.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs sm:text-sm text-red-400 hover:text-red-300 transition-colors"
                    >
                      <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                      View on Google Maps
                    </a>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No GPS coordinates set</p>
                )}
              </div>
            </div>
          )}

          {/* Scan History Tab */}
          {checkpointInfo && !loading && activeTab === 'history' && (
            <div className="space-y-3">
              {scanHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No scan history available</p>
                </div>
              ) : (
                scanHistory.map((scan) => (
                  <div
                    key={scan.id}
                    className="bg-slate-800/50 rounded-lg p-3 sm:p-4 border border-slate-700/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2 rounded-lg flex-shrink-0 ${scan.location_verified ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                          {scan.location_verified ? (
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <User className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            <p className="text-sm font-medium text-white truncate">{scan.supervisor_name}</p>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            <p className="text-xs text-slate-400">{formatDateTime(scan.scanned_at)}</p>
                          </div>
                        </div>
                      </div>
                      {scan.latitude && scan.longitude && (
                        <a
                          href={`https://www.google.com/maps?q=${scan.latitude},${scan.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors flex-shrink-0"
                        >
                          <MapPin className="w-4 h-4 text-red-400" />
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
