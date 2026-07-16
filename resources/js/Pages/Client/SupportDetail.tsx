import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import IconMapper from '@/Components/IconMapper';

interface Reply {
  id: number;
  user_name: string;
  message: string;
  is_internal: boolean;
  created_at: string;
}

interface Ticket {
  id: number;
  ticket_number: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
  replies: Reply[];
}

interface ClientSupportDetailProps {
  auth: {
    user: {
      id: number;
      name: string;
      email: string;
    };
  };
  ticket: Ticket;
}

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const colors: Record<string, string> = {
    open: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    resolved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    closed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status] || colors.closed}`}>
      {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
    </span>
  );
};

const PriorityBadge: React.FC<{ priority: string }> = ({ priority }) => {
  const colors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    urgent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${colors[priority] || colors.low}`}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
};

const CategoryBadge: React.FC<{ category: string }> = ({ category }) => {
  const colors: Record<string, string> = {
    technical: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    billing: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    security: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    general: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${colors[category] || colors.general}`}>
      {category.charAt(0).toUpperCase() + category.slice(1)}
    </span>
  );
};

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function ClientSupportDetail({ auth, ticket }: ClientSupportDetailProps) {
  const form = useForm({
    message: '',
  });

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault();
    form.post(route('client.support.reply', ticket.id), {
      onSuccess: () => form.reset(),
    });
  };

  return (
    <AuthenticatedLayout header={`Ticket ${ticket.ticket_number}`} user={auth?.user}>
      <Head title={`Ticket ${ticket.ticket_number}`} />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-gradient-to-br from-red-900 via-red-800 to-rose-900 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col gap-4">
              <Link
                href={route('client.support')}
                className="flex items-center gap-2 text-red-200 hover:text-white text-sm"
              >
                <IconMapper name="ArrowLeft" size={16} />
                Back to Support
              </Link>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-red-200 font-mono mb-1">{ticket.ticket_number}</p>
                  <h1 className="text-xl sm:text-2xl font-bold">{ticket.subject}</h1>
                </div>
                <StatusBadge status={ticket.status} />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Ticket Info */}
          <Card className="p-4 sm:p-6 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex flex-wrap gap-3 mb-4">
              <CategoryBadge category={ticket.category} />
              <PriorityBadge priority={ticket.priority} />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Created</p>
                <p className="text-gray-900 dark:text-gray-100">{formatDateTime(ticket.created_at)}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Last Updated</p>
                <p className="text-gray-900 dark:text-gray-100">{formatDateTime(ticket.updated_at)}</p>
              </div>
            </div>
          </Card>

          {/* Replies */}
          <div className="space-y-4">
            {ticket.replies.map((reply) => (
              <Card
                key={reply.id}
                className={`p-4 sm:p-6 ${
                  reply.is_internal
                    ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800'
                    : 'dark:bg-gray-800 dark:border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      reply.is_internal
                        ? 'bg-yellow-100 dark:bg-yellow-900/30'
                        : 'bg-red-100 dark:bg-red-900/30'
                    }`}>
                      <IconMapper
                        name={reply.is_internal ? "Shield" : "User"}
                        size={16}
                        className={reply.is_internal ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}
                      />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                        {reply.user_name}
                        {reply.is_internal && (
                          <span className="ml-2 text-xs text-yellow-600 dark:text-yellow-400">(Support Team)</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDateTime(reply.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {reply.message}
                </div>
              </Card>
            ))}
          </div>

          {/* Reply Form */}
          {ticket.status !== 'closed' && (
            <Card className="p-4 sm:p-6 dark:bg-gray-800 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <IconMapper name="Reply" size={18} className="text-red-600 dark:text-red-400" />
                Add Reply
              </h3>
              <form onSubmit={handleReply} className="space-y-4">
                <textarea
                  value={form.data.message}
                  onChange={(e) => form.setData('message', e.target.value)}
                  placeholder="Type your reply..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm resize-none"
                />
                {form.errors.message && (
                  <p className="text-red-500 text-xs">{form.errors.message}</p>
                )}
                <div className="flex justify-end">
                  <Button type="submit" disabled={form.processing} className="bg-red-600 hover:bg-red-700 text-white">
                    <IconMapper name="Send" size={16} className="mr-2" />
                    {form.processing ? 'Sending...' : 'Send Reply'}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {ticket.status === 'closed' && (
            <Card className="p-4 sm:p-6 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 text-center">
              <IconMapper name="CheckCircle" size={32} className="mx-auto text-green-500 mb-2" />
              <p className="text-gray-600 dark:text-gray-400">This ticket has been closed</p>
            </Card>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
