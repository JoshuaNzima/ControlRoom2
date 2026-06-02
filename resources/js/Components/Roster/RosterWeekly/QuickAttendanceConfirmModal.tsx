import React from 'react';
import Modal from '@/Components/Modal';

export default function QuickAttendanceConfirmModal({
  open,
  onClose,
  guardId,
  siteId,
  action,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  guardId?: number;
  siteId?: number | null;
  action?: 'present' | 'absent';
  onConfirm: (guardId: number, action: 'present' | 'absent', siteId?: number | null) => void;
}) {
  const handleClose = () => onClose();
  const canConfirm = !!guardId && !!action;

  return (
    <Modal show={open} onClose={handleClose} maxWidth="sm">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Confirm Attendance</h2>
        <button
          type="button"
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ✕
        </button>
      </div>

      <div className="px-6 py-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 space-y-3">
        <div className="text-sm text-gray-700 dark:text-gray-200">
          {action === 'present' ? 'Mark this guard as present for today?' : 'Mark this guard as absent for today?'}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!canConfirm}
            onClick={() => {
              if (!guardId || !action) return;
              onConfirm(guardId, action, siteId ?? null);
            }}
            className={`px-4 py-2 text-sm rounded-md text-white ${
              action === 'absent' ? 'bg-red-700 hover:bg-red-600' : 'bg-emerald-700 hover:bg-emerald-600'
            } disabled:opacity-60`}
          >
            Confirm
          </button>
        </div>
      </div>
    </Modal>
  );
}
