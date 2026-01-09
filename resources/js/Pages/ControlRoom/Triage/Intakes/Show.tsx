import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import IconMapper from '@/Components/IconMapper';

interface Intake {
  id: number;
  type: 'ticket' | 'down' | 'incident';
  name: string;
  email: string;
  phone?: string | null;
  client_name?: string | null;
  client_site?: string | null;
  title?: string | null;
  category?: string | null;
  priority?: string | null;
  description: string;
  attachments?: { filename: string; path: string; mime_type: string; size: number }[] | null;
  status: string;
  created_at: string;
  converted_id?: number | null;
  converted_type?: 'ticket' | 'down' | 'incident' | null;
}

interface Props { intake: Intake }

export default function Show({ intake }: Props) {
  const convertForm = useForm<{ target_type: 'ticket' | 'down' | 'incident' }>({ target_type: intake.type });

  const onConvert = (e: React.FormEvent) => {
    e.preventDefault();
    convertForm.post(route('control-room.triage.intakes.convert', { intake: intake.id }), {
      preserveScroll: true,
    });
  };

  return (
    <ControlRoomLayout title="Public Intake — Triage">
      <Head title="Triage — Intake" />

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              intake.type === 'ticket'
                ? 'bg-coin-100 text-coin-800 dark:bg-coin-900/20 dark:text-coin-200'
                : intake.type === 'down'
                  ? 'bg-coin-50 text-coin-800 dark:bg-coin-900/10 dark:text-coin-200'
                  : 'bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-200'
            }`}>
              <IconMapper name={intake.type === 'ticket' ? 'Inbox' : intake.type === 'down' ? 'ArrowDownCircle' : 'AlertTriangle'} className="w-3.5 h-3.5 mr-1" />
              {intake.type}
            </span>
            <h1 className="text-xl font-semibold text-red-900 dark:text-gray-100">{intake.title || '(No title)'}</h1>
          </div>
          <Link href={route('control-room.triage.intakes.index')} className="text-sm px-3 py-1.5 rounded-md border border-red-200 bg-white hover:bg-red-50 dark:bg-gray-800 dark:border-gray-700">Back</Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-red-100 dark:border-gray-800 p-4">
              <h2 className="text-sm font-semibold text-red-900 dark:text-gray-100 mb-2">Details</h2>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-red-800/80 dark:text-gray-400">Name</dt>
                  <dd className="font-medium text-red-900 dark:text-gray-100">{intake.name}</dd>
                </div>
                <div>
                  <dt className="text-red-800/80 dark:text-gray-400">Email</dt>
                  <dd className="font-medium text-red-900 dark:text-gray-100">{intake.email}</dd>
                </div>
                {intake.phone && (
                  <div>
                    <dt className="text-red-800/80 dark:text-gray-400">Phone</dt>
                    <dd className="font-medium text-red-900 dark:text-gray-100">{intake.phone}</dd>
                  </div>
                )}
                {intake.client_name && (
                  <div>
                    <dt className="text-red-800/80 dark:text-gray-400">Client</dt>
                    <dd className="font-medium text-red-900 dark:text-gray-100">{intake.client_name}</dd>
                  </div>
                )}
                {intake.client_site && (
                  <div>
                    <dt className="text-red-800/80 dark:text-gray-400">Site</dt>
                    <dd className="font-medium text-red-900 dark:text-gray-100">{intake.client_site}</dd>
                  </div>
                )}
                {intake.category && (
                  <div>
                    <dt className="text-red-800/80 dark:text-gray-400">Category</dt>
                    <dd className="font-medium text-red-900 dark:text-gray-100">{intake.category}</dd>
                  </div>
                )}
                {intake.priority && (
                  <div>
                    <dt className="text-red-800/80 dark:text-gray-400">Priority</dt>
                    <dd className="font-medium text-red-900 dark:text-gray-100">{intake.priority}</dd>
                  </div>
                )}
              </dl>
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-red-900 dark:text-gray-100 mb-1">Description</h3>
                <p className="text-sm text-red-900/90 dark:text-gray-200 whitespace-pre-line">{intake.description}</p>
              </div>
            </div>

            {Array.isArray(intake.attachments) && intake.attachments.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-red-100 dark:border-gray-800 p-4">
                <h2 className="text-sm font-semibold text-red-900 dark:text-gray-100 mb-2">Attachments</h2>
                <ul className="space-y-2 text-sm">
                  {intake.attachments!.map((f, idx) => (
                    <li key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <IconMapper name="Paperclip" className="w-4 h-4" />
                        <span>{f.filename}</span>
                        <span className="text-xs text-red-700/70 dark:text-gray-400">{Math.round(f.size / 1024)} KB</span>
                      </div>
                      <a href={`/storage/${f.path}`} className="text-xs px-2 py-1 rounded border border-red-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-red-900 dark:text-gray-100 hover:bg-red-50 dark:hover:bg-gray-800">Download</a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-red-100 dark:border-gray-800 p-4">
              <h2 className="text-sm font-semibold text-red-900 dark:text-gray-100 mb-3">Convert</h2>
              {intake.converted_id ? (
                <div className="text-sm p-3 rounded bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-200 dark:border-green-900/30">
                  Already converted to {intake.converted_type} (ID #{intake.converted_id})
                </div>
              ) : (
                <form onSubmit={onConvert} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-red-900 dark:text-gray-200 mb-1">Target Type</label>
                    <select value={convertForm.data.target_type} onChange={(e) => convertForm.setData('target_type', e.target.value as any)} className="w-full rounded border border-red-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-red-900 dark:text-gray-100 text-sm">
                      <option value="ticket">Ticket</option>
                      <option value="down">Down</option>
                      <option value="incident">Incident</option>
                    </select>
                  </div>
                  <button type="submit" disabled={convertForm.processing} className="w-full inline-flex items-center justify-center px-4 py-2 rounded-lg bg-coin-700 hover:bg-coin-800 text-white text-sm disabled:opacity-60">
                    <IconMapper name="ArrowRightCircle" className="w-4 h-4 mr-2" />
                    Convert
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </ControlRoomLayout>
  );
}
