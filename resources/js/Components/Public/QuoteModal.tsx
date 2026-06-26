import React from 'react';
import { useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import IconMapper from '@/Components/IconMapper';
import { Send } from 'lucide-react';

interface Props {
  show: boolean;
  onClose: () => void;
  /** Optional prefix for the subject, e.g. service name */
  subjectPrefix?: string;
}

export default function QuoteModal({ show, onClose, subjectPrefix }: Props) {
  const { data, setData, post, processing, reset, errors } = useForm({
    name: '',
    email: '',
    subject: subjectPrefix ? `Quote Request — ${subjectPrefix}` : 'Request a Quote',
    message: '',
    website: '',
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('public.contact.store'), {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  };

  return (
    <Modal show={show} onClose={onClose} maxWidth="xl">
      <div className="p-6 bg-coin-dark text-coin-text">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Request a Quote</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-coin-muted hover:text-coin-text"
          >
            <IconMapper name="X" className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          {/* Honeypot */}
          <input
            type="text"
            name="website"
            value={data.website}
            onChange={(e) => setData('website', e.target.value)}
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-coin-muted">Full Name *</label>
              <input
                value={data.name}
                onChange={(e) => setData('name', e.target.value)}
                required
                className="w-full mt-1 rounded-lg border border-coin-border bg-coin-card text-coin-text px-3 py-2 focus:outline-none focus:border-coin-accent/50"
              />
              {errors.name && <div className="text-sm text-red-400">{errors.name}</div>}
            </div>
            <div>
              <label className="text-sm text-coin-muted">Email *</label>
              <input
                type="email"
                value={data.email}
                onChange={(e) => setData('email', e.target.value)}
                required
                className="w-full mt-1 rounded-lg border border-coin-border bg-coin-card text-coin-text px-3 py-2 focus:outline-none focus:border-coin-accent/50"
              />
              {errors.email && <div className="text-sm text-red-400">{errors.email}</div>}
            </div>
          </div>

          <div>
            <label className="text-sm text-coin-muted">Subject *</label>
            <input
              value={data.subject}
              onChange={(e) => setData('subject', e.target.value)}
              required
              className="w-full mt-1 rounded-lg border border-coin-border bg-coin-card text-coin-text px-3 py-2 focus:outline-none focus:border-coin-accent/50"
            />
          </div>

          <div>
            <label className="text-sm text-coin-muted">Message *</label>
            <textarea
              value={data.message}
              onChange={(e) => setData('message', e.target.value)}
              required
              className="w-full mt-1 rounded-lg border border-coin-border bg-coin-card text-coin-text px-3 py-2 min-h-[120px] focus:outline-none focus:border-coin-accent/50"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={processing}
              className="inline-flex items-center gap-2 px-5 py-3 bg-coin-accent text-white rounded-lg font-medium hover:bg-coin-accent-light disabled:opacity-60"
            >
              <Send className="w-4 h-4" /> Send
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
