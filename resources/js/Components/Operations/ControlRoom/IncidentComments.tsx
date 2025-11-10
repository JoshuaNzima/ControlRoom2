import React from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import IconMapper from '@/Components/IconMapper';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id: number;
  comment: string;
  created_at: string;
  is_internal: boolean;
  user: {
    id: number;
    name: string;
  };
}

interface IncidentCommentsProps {
  incidentId: number;
  comments: Comment[];
}

export default function IncidentComments({ incidentId, comments }: IncidentCommentsProps) {
  const { data, setData, post, processing, reset } = useForm({
    comment: '',
    is_internal: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('control-room.incidents.comments.store', incidentId), {
      onSuccess: () => reset('comment'),
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {comments.map(comment => (
          <div
            key={comment.id}
            className={`p-4 rounded-lg ${
              comment.is_internal ? 'bg-red-50 border border-red-100' : 'bg-gray-50 border border-gray-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{comment.user.name}</span>
                {comment.is_internal && (
                  <span className="px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full">Internal</span>
                )}
              </div>
              <span className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </span>
            </div>
            <p className="mt-2 text-gray-700">{comment.comment}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-4">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <textarea
              value={data.comment}
              onChange={e => setData('comment', e.target.value)}
              placeholder="Add a comment..."
              rows={3}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
              required
            />
            <div className="mt-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={data.is_internal}
                  onChange={e => setData('is_internal', e.target.checked)}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm text-gray-700">Internal comment</span>
              </label>
            </div>
          </div>
          <Button type="submit" disabled={processing}>
            <IconMapper name="send" className="w-4 h-4 mr-2" />
            Send
          </Button>
        </div>
      </form>
    </div>
  );
}