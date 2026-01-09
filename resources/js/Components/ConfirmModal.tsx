import React from 'react';

type Props = {
    open: boolean;
    title?: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
};

const ConfirmModal = ({ open, title = 'Confirm', message = '', confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel }: Props) => {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black opacity-30" onClick={onCancel}></div>
            <div className="bg-white dark:bg-gray-900 rounded shadow-lg p-6 z-10 w-full max-w-md text-gray-900 dark:text-gray-100">
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">{message}</p>
                <div className="flex justify-end gap-2">
                    <button onClick={onCancel} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200">{cancelLabel}</button>
                    <button onClick={onConfirm} className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white">{confirmLabel}</button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
