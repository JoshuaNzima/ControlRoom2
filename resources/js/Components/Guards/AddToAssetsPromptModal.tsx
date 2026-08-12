import React, { useState } from 'react';
import Modal from '@/Components/Modal';
import { Button } from '@/Components/ui/button';
import IconMapper from '@/Components/IconMapper';
import { useNotification } from '@/Providers/NotificationProvider';

interface AddToAssetsPromptModalProps {
  open: boolean;
  onClose: () => void;
  item: string;
  type: 'equipment' | 'uniform';
  guardId?: number;
  inventoryInfo?: {
    available_count: number;
    total_count: number;
    issued_count: number;
  };
  onConfirm: () => Promise<void>;
}

export default function AddToAssetsPromptModal({
  open,
  onClose,
  item,
  type,
  guardId,
  inventoryInfo,
  onConfirm,
}: AddToAssetsPromptModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { pushSuccess, pushError } = useNotification();

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      await onConfirm();
      pushSuccess(`${item} has been added to the assets inventory.`);
      onClose();
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to add item to assets';
      setError(errorMessage);
      pushError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      onClose();
    }
  };

  return (
    <Modal show={open} onClose={handleClose} maxWidth="md">
      <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <IconMapper name="PackagePlus" size={20} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Add to Assets Inventory?</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This item is not tracked in assets
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 sm:px-6 py-4 space-y-4">
          {/* Warning */}
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-2">
              <IconMapper name="AlertTriangle" size={18} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <p className="font-medium">Inventory Exceeded or Missing</p>
                <p className="mt-1">
                  You're marking <span className="font-semibold">{item}</span> as issued, but{' '}
                  {inventoryInfo?.total_count === 0
                    ? 'this item does not exist in the assets inventory.'
                    : 'the assets inventory has insufficient stock.'}
                </p>
              </div>
            </div>
          </div>

          {/* Inventory Stats */}
          {inventoryInfo && inventoryInfo.total_count > 0 && (
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{inventoryInfo.total_count}</p>
              </div>
              <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">Available</p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">{inventoryInfo.available_count}</p>
              </div>
              <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">Issued</p>
                <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{inventoryInfo.issued_count}</p>
              </div>
            </div>
          )}

          {/* Action Description */}
          <div className="text-sm text-gray-600 dark:text-gray-300">
            <p>
              Would you like to add <span className="font-medium">{item}</span> to the assets inventory?
              The asset manager will be able to view and manage this item.
            </p>
            {guardId && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                This will be noted as created from a guard compliance check.
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="p-2 rounded bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            Skip
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white"
          >
            {loading ? (
              <>
                <IconMapper name="Loader2" size={16} className="animate-spin mr-2" />
                Adding...
              </>
            ) : (
              <>
                <IconMapper name="Plus" size={16} className="mr-2" />
                Add to Assets
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
