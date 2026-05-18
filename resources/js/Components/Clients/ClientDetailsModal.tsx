import React from 'react';

type ClientDetailsModalProps = {
  client: any;
  open: boolean;
  onClose: () => void;

  // Other props passed by pages (kept loose so we don’t block the build)
  services?: Array<{
    id: number;
    name: string;
    monthly_price: number;
    required_guards?: number;
    [key: string]: unknown;
  }>;
  zones?: Array<{ id: number; name: string }>;
  supervisors?: Array<{ id: number; name: string; email?: string }>;
  sergeants?: Array<{ id: number; name: string; position?: string }>;
  onClientUpdated?: (client: unknown) => void;
};

export default function ClientDetailsModal({ open, onClose }: ClientDetailsModalProps) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div className="w-full max-w-lg rounded-lg bg-white p-4 shadow-xl border border-gray-200">
        <div className="font-semibold text-gray-900">Client Details</div>
        <div className="mt-2 text-sm text-gray-700">
          This modal is temporarily unavailable due to a build error in the previous implementation.
        </div>
        <button
          type="button"
          className="mt-4 inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-900 hover:bg-gray-50"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}
