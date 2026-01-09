import React from 'react';
import Modal from '@/Components/Modal';
import Textarea from '@/Components/ui/textarea';

type Props = {
  open: boolean;
  title?: string;
  message?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
};

export default function ReasonModal({
  open,
  title = 'Reason',
  message = '',
  placeholder = 'Optional reason or notes',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: Props) {
  const [reason, setReason] = React.useState('');

  React.useEffect(() => {
    if (open) setReason('');
  }, [open]);

  if (!open) return null;

  return (
    <Modal show={open} onClose={onCancel} maxWidth="md">
      <div className="p-5 sm:p-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        {message && <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{message}</p>}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason (optional)</label>
          <Textarea
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={placeholder}
            className="dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700">{cancelLabel}</button>
          <button onClick={() => onConfirm(reason)} className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white">{confirmLabel}</button>
        </div>
      </div>
    </Modal>
  );
}
