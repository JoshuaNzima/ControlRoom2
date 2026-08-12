import React from 'react';
import { useForm } from '@inertiajs/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import { Textarea } from '@/Components/ui/textarea';
import { Label } from '@/Components/ui/label';
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

export default function CompleteTaskModal({ task, open, onClose }: Props) {
  const { data, setData, post, processing, errors } = useForm({
    completion_notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('tasks.complete', task.id), {
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
            <IconMapper name="check-circle" className="h-5 w-5 text-green-600" />
            Complete Task
          </DialogTitle>
        </DialogHeader>

        <div className="mt-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Are you sure you want to mark <span className="font-medium text-gray-700 dark:text-gray-300">"{task.title}"</span> as completed?
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="completion_notes" className="text-red-900 dark:text-gray-200">
              Completion Notes (optional)
            </Label>
            <Textarea
              id="completion_notes"
              value={data.completion_notes}
              onChange={(e) => setData('completion_notes', e.target.value)}
              className="mt-1 dark:bg-gray-700 dark:border-gray-600"
              rows={3}
              placeholder="Add any notes about task completion..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-gray-300 dark:border-gray-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={processing}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <IconMapper name="check" className="h-4 w-4 mr-2" />
              {processing ? 'Completing...' : 'Mark Complete'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
