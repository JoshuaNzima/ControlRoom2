import React from 'react';
import { Head, usePage } from '@inertiajs/react';

interface CheckpointSite {
  id: number;
  name: string;
  client?: { id: number; name: string } | null;
}

interface Checkpoint {
  id: number;
  name: string;
  code: string;
  type: string;
  site: CheckpointSite | null;
}

interface PageProps {
  checkpoint: Checkpoint;
  qrUrl: string;
  layout: 'portrait' | 'landscape';
}

export default function CheckpointQrPrint() {
  const { checkpoint, qrUrl, layout = 'portrait' } = usePage().props as unknown as PageProps;
  
  const isLandscape = layout === 'landscape';

  return (
    <div className={`bg-white ${isLandscape ? 'min-h-screen' : 'min-h-screen'} print:p-0`}>
      <Head title={`QR Code - ${checkpoint.name}`} />
      
      <style>{`
        @media print {
          body { margin: 0; padding: 0; }
          .no-print { display: none !important; }
          .print-container {
            width: 100% !important;
            max-width: none !important;
          }
        }
        @page {
          size: ${isLandscape ? 'landscape' : 'portrait'};
          margin: 10mm;
        }
      `}</style>

      <div className={`print-container mx-auto p-4 ${isLandscape ? 'max-w-4xl' : 'max-w-md'}`}>
        {isLandscape ? (
          // Landscape layout - side by side
          <div className="flex items-center justify-between gap-8">
            <div className="flex-1">
              <img 
                src={qrUrl} 
                alt={`${checkpoint.name} QR`} 
                className="w-48 h-48 mx-auto"
              />
            </div>
            
            <div className="flex-1 space-y-4">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900">COIN SECURITY</h1>
                <p className="text-lg text-gray-600 mt-1">Checkpoint QR Code</p>
              </div>
              
              <div className="text-center space-y-2">
                <div>
                  <span className="text-sm text-gray-500">Checkpoint:</span>
                  <p className="text-xl font-semibold text-gray-900">{checkpoint.name}</p>
                </div>
                
                {checkpoint.site && (
                  <div>
                    <span className="text-sm text-gray-500">Site:</span>
                    <p className="text-lg font-medium text-gray-800">{checkpoint.site.name}</p>
                    {checkpoint.site.client && (
                      <p className="text-sm text-gray-600">{checkpoint.site.client.name}</p>
                    )}
                  </div>
                )}
                
                <div>
                  <span className="text-sm text-gray-500">Code:</span>
                  <p className="text-sm font-mono text-gray-700">{checkpoint.code}</p>
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-sm font-semibold text-red-800">EMERGENCY HOTLINE</p>
                <p className="text-2xl font-bold text-red-600">999 / 0999 999 999</p>
              </div>
            </div>
          </div>
        ) : (
          // Portrait layout - stacked
          <div className="text-center space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">COIN SECURITY</h1>
              <p className="text-sm text-gray-600 mt-1">Checkpoint QR Code</p>
            </div>
            
            <img 
              src={qrUrl} 
              alt={`${checkpoint.name} QR`} 
              className="w-48 h-48 mx-auto"
            />
            
            <div className="space-y-2">
              <div>
                <span className="text-xs text-gray-500">Checkpoint:</span>
                <p className="text-lg font-semibold text-gray-900">{checkpoint.name}</p>
              </div>
              
              {checkpoint.site && (
                <div>
                  <span className="text-xs text-gray-500">Site:</span>
                  <p className="text-sm font-medium text-gray-800">{checkpoint.site.name}</p>
                  {checkpoint.site.client && (
                    <p className="text-xs text-gray-600">{checkpoint.site.client.name}</p>
                  )}
                </div>
              )}
              
              <div>
                <span className="text-xs text-gray-500">Code:</span>
                <p className="text-xs font-mono text-gray-700">{checkpoint.code}</p>
              </div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-red-800">EMERGENCY HOTLINE</p>
              <p className="text-lg font-bold text-red-600">999 / 0999 999 999</p>
            </div>
          </div>
        )}
        
        <div className="no-print mt-6 flex justify-center gap-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-coin-600 text-white rounded-md hover:bg-coin-700"
          >
            Print
          </button>
          <button
            onClick={() => window.close()}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
