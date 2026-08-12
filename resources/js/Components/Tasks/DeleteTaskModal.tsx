import React from 'react';
import { useForm } from '@inertiajs/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import IconMapper from '@/Components/IconMapper';

interface Task {
  id: number;
  title: string;
}

interface Props {
  task: Task;
  open: boolean;
  onClose: () => void;
}

export default function DeleteTaskModal({ task, open, onClose }: Props) {
  const { delete: destroy, processing } = useForm();

  const handleConfirm = () => {
    destroy(route('tasks.destroy', task.id), {
      onSuccess: () => {
        onClose();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800 border-red-100 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-red-900 dark:text-white flex items-center gap-2">
            <IconMapper name="trash-2" className="h-5 w-5 text-red-600" />
            Delete Task
          </DialogTitle>
        </DialogHeader>

        <div className="mt-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Are you sure you want to delete <span className="font-medium text-gray-700 dark:text-gray-300">"{task.title}"</span>?
          </p>
          <p className="mt-2 text-sm text-red-500">
            This action cannot be undone.
          </p>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-300 dark:border-gray-600"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={processing}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <IconMapper name="trash-2" className="h-4 w-4 mr-2" />
            {processing ? 'Deleting...' : 'Delete Task'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
