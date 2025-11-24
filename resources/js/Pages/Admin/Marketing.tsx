import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card } from '@/Components/ui/card';
import IconMapper from '@/Components/IconMapper';
import Modal from '@/Components/Modal';

interface Campaign {
  id: number;
  name: string;
  channel?: string | null;
  budget?: number | string | null;
  status: string;
  start_date?: string | null;
  end_date?: string | null;
  target_audience?: string | null;
  objective?: string | null;
  notes?: string | null;
  created_at?: string;
}

interface Props {
  auth?: any;
  summary?: {
    total_campaigns?: number;
    active_campaigns?: number;
    planned_campaigns?: number;
    completed_campaigns?: number;
    total_budget?: number;
  };
  byChannel?: { channel: string | null; count: number; budget: number }[];
  recent?: Campaign[];
  campaigns?: {
    data: Campaign[];
    links: any[];
    meta: any;
  };
  channels?: string[];
  statuses?: string[];
}

const channelLabel = (channel?: string | null) => {
  if (!channel) return 'Unspecified';
  return String(channel).replace(/_/g, ' ');
};

const statusColor = (status?: string) => {
  switch (status) {
    case 'active':
      return 'bg-emerald-100 text-emerald-800';
    case 'planned':
      return 'bg-blue-100 text-blue-800';
    case 'paused':
      return 'bg-yellow-100 text-yellow-800';
    case 'completed':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function MarketingPage({
  auth = {} as any,
  summary = {},
  byChannel = [],
  recent = [],
  campaigns,
  channels = [],
  statuses = [],
}: Props) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState<Campaign | null>(null);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const openView = async (campaign: Campaign) => {
    setLoadingId(campaign.id);
    try {
      const response = await fetch(route('admin.marketing.campaigns.json', campaign.id), {
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      if (!response.ok) throw new Error('Failed to load campaign');
      const json = await response.json();
      setSelected(json as Campaign);
      setViewOpen(true);
    } catch (e) {
      setSelected(campaign);
      setViewOpen(true);
    } finally {
      setLoadingId(null);
    }
  };

  const openEdit = (campaign: Campaign) => {
    setSelected(campaign);
    setEditOpen(true);
  };

  const handleDelete = (campaign: Campaign) => {
    if (!confirm('Delete this campaign? This action cannot be undone.')) return;
    router.delete(route('admin.marketing.campaigns.destroy', campaign.id));
  };

  const totalBudget = summary.total_budget ?? 0;

  return (
    <AdminLayout title="Marketing" user={auth?.user as any}>
      <Head title="Marketing" />
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-red-900">Marketing Overview</h1>
              <p className="text-sm text-red-800/80 mt-1">
                Monitor campaign pipeline, live activity, and media spend across channels.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700"
              >
                <IconMapper name="megaphone" className="w-4 h-4 mr-2" />
                New Campaign
              </button>
              <Link
                href={route('admin.modules.index')}
                className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-white text-red-800 border border-red-200 hover:bg-red-50"
              >
                <IconMapper name="grid-3x3" className="w-4 h-4 mr-2" />
                Modules
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-indigo-900">Total Campaigns</h3>
                <IconMapper name="megaphone" className="w-5 h-5 text-indigo-500" />
              </div>
              <p className="text-2xl font-bold text-indigo-900">
                {summary.total_campaigns ?? 0}
              </p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-emerald-900">Active Campaigns</h3>
                <IconMapper name="play" className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-emerald-900">
                {summary.active_campaigns ?? 0}
              </p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-blue-900">Planned Campaigns</h3>
                <IconMapper name="calendar" className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-blue-900">
                {summary.planned_campaigns ?? 0}
              </p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-900">Total Media Budget</h3>
                <IconMapper name="wallet" className="w-5 h-5 text-gray-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                MWK {Number(totalBudget || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-6 col-span-1 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Campaigns by Channel</h2>
                  <p className="text-xs text-gray-500 mt-1">Campaign count and budget by channel</p>
                </div>
              </div>
              {byChannel.length === 0 ? (
                <p className="text-sm text-gray-500">No campaigns yet. Start by creating a new campaign.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Channel</th>
                        <th className="px-3 py-2 text-right font-semibold text-gray-600">Campaigns</th>
                        <th className="px-3 py-2 text-right font-semibold text-gray-600">Budget</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {byChannel.map((row, idx) => (
                        <tr key={`${row.channel}-${idx}`}>
                          <td className="px-3 py-2 text-gray-800">{channelLabel(row.channel)}</td>
                          <td className="px-3 py-2 text-right text-gray-900">{row.count}</td>
                          <td className="px-3 py-2 text-right text-gray-900">
                            MWK {Number(row.budget || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <div className="space-y-4">
              <Card className="p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Campaigns</h3>
                <div className="space-y-2 text-sm">
                  {(!recent || recent.length === 0) && (
                    <p className="text-gray-500">No campaigns yet.</p>
                  )}
                  {recent && recent.map((c) => (
                    <div key={c.id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{c.name}</div>
                        <div className="text-xs text-gray-500">{channelLabel(c.channel)}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColor(c.status)}`}>
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">All Campaigns</h2>
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="inline-flex items-center px-3 py-2 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700"
              >
                <IconMapper name="plus" className="w-4 h-4 mr-1" />
                New Campaign
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Name</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Channel</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Audience</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-600">Budget</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Status</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {campaigns?.data?.length ? (
                    campaigns.data.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-900 max-w-xs truncate">{c.name}</td>
                        <td className="px-3 py-2 text-gray-700">{channelLabel(c.channel)}</td>
                        <td className="px-3 py-2 text-gray-700 max-w-xs truncate">
                          {c.target_audience || '—'}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-900">
                          MWK {Number(c.budget || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColor(c.status)}`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openView(c)}
                              className="text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                              disabled={loadingId === c.id}
                            >
                              {loadingId === c.id ? 'Opening…' : 'View'}
                            </button>
                            <button
                              type="button"
                              onClick={() => openEdit(c)}
                              className="text-gray-700 hover:text-gray-900"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(c)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-3 py-6 text-center text-gray-500">
                        No campaigns yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {(campaigns?.meta?.last_page ?? 1) > 1 && (
              <div className="mt-4 flex justify-center gap-2">
                {(campaigns?.links ?? []).map((link: any, idx: number) => (
                  <Link
                    key={idx}
                    href={link.url || '#'}
                    className={`px-3 py-1 rounded text-xs ${
                      link.active
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                  />
                ))}
              </div>
            )}
          </Card>

          <CampaignCreateModal
            open={createOpen}
            onClose={() => setCreateOpen(false)}
            channels={channels}
            statuses={statuses}
          />

          {selected && (
            <CampaignEditModal
              open={editOpen}
              onClose={() => {
                setEditOpen(false);
                setSelected(null);
              }}
              campaign={selected}
              channels={channels}
              statuses={statuses}
            />
          )}

          {selected && (
            <CampaignViewModal
              open={viewOpen}
              onClose={() => {
                setViewOpen(false);
                setSelected(null);
              }}
              campaign={selected}
            />
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

interface CampaignForm {
  name: string;
  channel: string;
  budget: string;
  status: string;
  start_date: string;
  end_date: string;
  target_audience: string;
  objective: string;
  notes: string;
}

interface CampaignModalPropsBase {
  open: boolean;
  onClose: () => void;
  channels: string[];
  statuses: string[];
}

function CampaignCreateModal({ open, onClose, channels, statuses }: CampaignModalPropsBase) {
  const { data, setData, post, processing, errors, reset } = useForm<CampaignForm>({
    name: '',
    channel: channels[0] || '',
    budget: '',
    status: statuses[0] || 'planned',
    start_date: '',
    end_date: '',
    target_audience: '',
    objective: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('admin.marketing.campaigns.store'), {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  };

  const handleClose = () => {
    if (!processing) {
      onClose();
    }
  };

  return (
    <Modal show={open} onClose={handleClose} maxWidth="2xl">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white">
        <h2 className="text-lg font-semibold text-gray-900">New Campaign</h2>
        <button
          type="button"
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <span className="sr-only">Close</span>
          <svg
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
      <div className="px-6 py-4 bg-white">
        <form className="grid grid-cols-1 sm:grid-cols-2 gap-4" onSubmit={handleSubmit}>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              className="w-full border rounded-md p-2"
              value={data.name}
              onChange={(e) => setData('name', e.target.value)}
            />
            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
            <select
              className="w-full border rounded-md p-2"
              value={data.channel}
              onChange={(e) => setData('channel', e.target.value)}
            >
              <option value="">Select channel</option>
              {channels.map((ch) => (
                <option key={ch} value={ch}>
                  {channelLabel(ch)}
                </option>
              ))}
            </select>
            {errors.channel && <p className="text-sm text-red-600">{errors.channel}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full border rounded-md p-2"
              value={data.status}
              onChange={(e) => setData('status', e.target.value)}
            >
              {statuses.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
            {errors.status && <p className="text-sm text-red-600">{errors.status}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Budget (MWK)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              className="w-full border rounded-md p-2"
              value={data.budget}
              onChange={(e) => setData('budget', e.target.value)}
            />
            {errors.budget && <p className="text-sm text-red-600">{errors.budget}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              className="w-full border rounded-md p-2"
              value={data.start_date}
              onChange={(e) => setData('start_date', e.target.value)}
            />
            {errors.start_date && <p className="text-sm text-red-600">{errors.start_date}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              className="w-full border rounded-md p-2"
              value={data.end_date}
              onChange={(e) => setData('end_date', e.target.value)}
            />
            {errors.end_date && <p className="text-sm text-red-600">{errors.end_date}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
            <input
              className="w-full border rounded-md p-2"
              value={data.target_audience}
              onChange={(e) => setData('target_audience', e.target.value)}
              placeholder="e.g. Existing clients in Lilongwe, new SME prospects"
            />
            {errors.target_audience && (
              <p className="text-sm text-red-600">{errors.target_audience}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Objective</label>
            <textarea
              className="w-full border rounded-md p-2"
              rows={2}
              value={data.objective}
              onChange={(e) => setData('objective', e.target.value)}
              placeholder="e.g. Drive renewals, acquire new clients, upsell additional guards"
            />
            {errors.objective && <p className="text-sm text-red-600">{errors.objective}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              className="w-full border rounded-md p-2"
              rows={3}
              value={data.notes}
              onChange={(e) => setData('notes', e.target.value)}
            />
            {errors.notes && <p className="text-sm text-red-600">{errors.notes}</p>}
          </div>

          <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300"
              disabled={processing}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing}
              className="px-4 py-2 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-400"
            >
              {processing ? 'Saving...' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

interface CampaignEditModalProps extends CampaignModalPropsBase {
  campaign: Campaign;
}

function CampaignEditModal({ open, onClose, campaign, channels, statuses }: CampaignEditModalProps) {
  const { data, setData, put, processing, errors, reset } = useForm<CampaignForm>({
    name: campaign.name,
    channel: campaign.channel || '',
    budget: String(campaign.budget ?? ''),
    status: campaign.status || statuses[0] || 'planned',
    start_date: campaign.start_date ? campaign.start_date.slice(0, 10) : '',
    end_date: campaign.end_date ? campaign.end_date.slice(0, 10) : '',
    target_audience: campaign.target_audience || '',
    objective: campaign.objective || '',
    notes: campaign.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    put(route('admin.marketing.campaigns.update', campaign.id), {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  };

  const handleClose = () => {
    if (!processing) {
      onClose();
    }
  };

  return (
    <Modal show={open} onClose={handleClose} maxWidth="2xl">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white">
        <h2 className="text-lg font-semibold text-gray-900">Edit Campaign</h2>
        <button
          type="button"
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <span className="sr-only">Close</span>
          <svg
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
      <div className="px-6 py-4 bg-white">
        <form className="grid grid-cols-1 sm:grid-cols-2 gap-4" onSubmit={handleSubmit}>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              className="w-full border rounded-md p-2"
              value={data.name}
              onChange={(e) => setData('name', e.target.value)}
            />
            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
            <select
              className="w-full border rounded-md p-2"
              value={data.channel}
              onChange={(e) => setData('channel', e.target.value)}
            >
              <option value="">Select channel</option>
              {channels.map((ch) => (
                <option key={ch} value={ch}>
                  {channelLabel(ch)}
                </option>
              ))}
            </select>
            {errors.channel && <p className="text-sm text-red-600">{errors.channel}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full border rounded-md p-2"
              value={data.status}
              onChange={(e) => setData('status', e.target.value)}
            >
              {statuses.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
            {errors.status && <p className="text-sm text-red-600">{errors.status}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Budget (MWK)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              className="w-full border rounded-md p-2"
              value={data.budget}
              onChange={(e) => setData('budget', e.target.value)}
            />
            {errors.budget && <p className="text-sm text-red-600">{errors.budget}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              className="w-full border rounded-md p-2"
              value={data.start_date}
              onChange={(e) => setData('start_date', e.target.value)}
            />
            {errors.start_date && <p className="text-sm text-red-600">{errors.start_date}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              className="w-full border rounded-md p-2"
              value={data.end_date}
              onChange={(e) => setData('end_date', e.target.value)}
            />
            {errors.end_date && <p className="text-sm text-red-600">{errors.end_date}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
            <input
              className="w-full border rounded-md p-2"
              value={data.target_audience}
              onChange={(e) => setData('target_audience', e.target.value)}
              placeholder="e.g. Existing clients in Lilongwe, new SME prospects"
            />
            {errors.target_audience && (
              <p className="text-sm text-red-600">{errors.target_audience}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Objective</label>
            <textarea
              className="w-full border rounded-md p-2"
              rows={2}
              value={data.objective}
              onChange={(e) => setData('objective', e.target.value)}
              placeholder="e.g. Drive renewals, acquire new clients, upsell additional guards"
            />
            {errors.objective && <p className="text-sm text-red-600">{errors.objective}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              className="w-full border rounded-md p-2"
              rows={3}
              value={data.notes}
              onChange={(e) => setData('notes', e.target.value)}
            />
            {errors.notes && <p className="text-sm text-red-600">{errors.notes}</p>}
          </div>

          <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300"
              disabled={processing}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing}
              className="px-4 py-2 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-400"
            >
              {processing ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

interface CampaignViewModalProps {
  open: boolean;
  onClose: () => void;
  campaign: Campaign;
}

function CampaignViewModal({ open, onClose, campaign }: CampaignViewModalProps) {
  return (
    <Modal show={open} onClose={onClose} maxWidth="xl">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white">
        <h2 className="text-lg font-semibold text-gray-900">Campaign • {campaign.name}</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <span className="sr-only">Close</span>
          <svg
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
      <div className="px-6 py-4 bg-white space-y-4 text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="font-medium text-gray-700">Channel</div>
            <div className="text-gray-900">{channelLabel(campaign.channel)}</div>
          </div>
          <div>
            <div className="font-medium text-gray-700">Status</div>
            <span className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColor(campaign.status)}`}>
              {campaign.status}
            </span>
          </div>
          <div>
            <div className="font-medium text-gray-700">Budget</div>
            <div className="text-gray-900">
              MWK {Number(campaign.budget || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-700">Dates</div>
            <div className="text-gray-900">
              {campaign.start_date?.slice(0, 10) || '—'}
              {' '}–{' '}
              {campaign.end_date?.slice(0, 10) || '—'}
            </div>
          </div>
        </div>

        {campaign.target_audience && (
          <div>
            <div className="font-medium text-gray-700 mb-1">Target Audience</div>
            <div className="text-gray-900 bg-gray-50 rounded px-3 py-2 whitespace-pre-wrap">
              {campaign.target_audience}
            </div>
          </div>
        )}

        {campaign.objective && (
          <div>
            <div className="font-medium text-gray-700 mb-1">Objective</div>
            <div className="text-gray-900 bg-gray-50 rounded px-3 py-2 whitespace-pre-wrap">
              {campaign.objective}
            </div>
          </div>
        )}

        {campaign.notes && (
          <div>
            <div className="font-medium text-gray-700 mb-1">Notes</div>
            <div className="text-gray-900 bg-gray-50 rounded px-3 py-2 whitespace-pre-wrap">
              {campaign.notes}
            </div>
          </div>
        )}
      </div>
      <div className="px-6 py-3 bg-gray-50 border-t flex justify-end text-sm">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}
