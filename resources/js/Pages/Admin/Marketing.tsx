import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import MarketingLayout from '@/Layouts/MarketingLayout';
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
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200';
    case 'planned':
      return 'bg-coin-100 text-coin-800 dark:bg-coin-900/30 dark:text-coin-200';
    case 'paused':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
    case 'completed':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
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
    <MarketingLayout title="Marketing" user={auth?.user as any}>
      <Head title="Marketing" />
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-coin-700 dark:text-coin-300">Marketing Overview</h1>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Monitor campaign pipeline, live activity, and media spend across channels.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="inline-flex w-full sm:w-auto justify-center items-center px-4 py-2 rounded-lg text-sm font-medium bg-coin-700 text-white hover:bg-coin-600 focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950"
              >
                <IconMapper name="megaphone" className="w-4 h-4 mr-2" />
                New Campaign
              </button>
              <Link
                href={route('admin.modules.index')}
                className="inline-flex w-full sm:w-auto justify-center items-center px-4 py-2 rounded-lg text-sm font-medium bg-white dark:bg-gray-900/60 text-gray-700 dark:text-gray-100 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/60"
              >
                <IconMapper name="grid-3x3" className="w-4 h-4 mr-2" />
                Modules
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-gradient-to-br from-coin-50 to-coin-100 border-coin-200 dark:from-coin-900/20 dark:to-coin-900/10 dark:border-coin-900/30">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-coin-900 dark:text-coin-100">Total Campaigns</h3>
                <IconMapper name="megaphone" className="w-5 h-5 text-coin-600 dark:text-coin-300" />
              </div>
              <p className="text-2xl font-bold text-coin-900 dark:text-coin-100">
                {summary.total_campaigns ?? 0}
              </p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 dark:from-emerald-900/20 dark:to-emerald-900/10 dark:border-emerald-900/30">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-emerald-900 dark:text-emerald-100">Active Campaigns</h3>
                <IconMapper name="play" className="w-5 h-5 text-emerald-500 dark:text-emerald-300" />
              </div>
              <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                {summary.active_campaigns ?? 0}
              </p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-coin-50 to-coin-100 border-coin-200 dark:from-coin-900/20 dark:to-coin-900/10 dark:border-coin-900/30">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-coin-900 dark:text-coin-100">Planned Campaigns</h3>
                <IconMapper name="calendar" className="w-5 h-5 text-coin-600 dark:text-coin-300" />
              </div>
              <p className="text-2xl font-bold text-coin-900 dark:text-coin-100">
                {summary.planned_campaigns ?? 0}
              </p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 dark:from-gray-900 dark:to-gray-800 dark:border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Total Media Budget</h3>
                <IconMapper name="wallet" className="w-5 h-5 text-gray-500 dark:text-gray-300" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                MWK {Number(totalBudget || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-6 col-span-1 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Campaigns by Channel</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Campaign count and budget by channel</p>
                </div>
              </div>
              {byChannel.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No campaigns yet. Start by creating a new campaign.</p>
              ) : (
                <>
                  <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-800">
                    {byChannel.map((row, idx) => (
                      <div key={`${row.channel}-${idx}`} className="py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 break-words">{channelLabel(row.channel)}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{row.count} campaigns</div>
                        </div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                          MWK {Number(row.budget || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-[500px] w-full text-xs">
                      <thead className="bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">Channel</th>
                          <th className="px-3 py-2 text-right font-semibold text-gray-600 dark:text-gray-300">Campaigns</th>
                          <th className="px-3 py-2 text-right font-semibold text-gray-600 dark:text-gray-300">Budget</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                        {byChannel.map((row, idx) => (
                          <tr key={`${row.channel}-${idx}`}>
                            <td className="px-3 py-2 text-gray-800 dark:text-gray-200">{channelLabel(row.channel)}</td>
                            <td className="px-3 py-2 text-right text-gray-900 dark:text-gray-100">{row.count}</td>
                            <td className="px-3 py-2 text-right text-gray-900 dark:text-gray-100">
                              MWK {Number(row.budget || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </Card>

            <div className="space-y-4">
              <Card className="p-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Recent Campaigns</h3>
                <div className="space-y-2 text-sm">
                  {(!recent || recent.length === 0) && (
                    <p className="text-gray-500 dark:text-gray-400">No campaigns yet.</p>
                  )}
                  {recent && recent.map((c) => (
                    <div key={c.id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">{c.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{channelLabel(c.channel)}</div>
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
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">All Campaigns</h2>
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="inline-flex w-full sm:w-auto justify-center items-center px-3 py-2 rounded-md bg-coin-700 text-white text-sm hover:bg-coin-600 focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950"
              >
                <IconMapper name="plus" className="w-4 h-4 mr-1" />
                New Campaign
              </button>
            </div>

            <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-800">
              {campaigns?.data?.length ? (
                campaigns.data.map((c) => (
                  <div key={c.id} className="py-4 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-words">{c.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{channelLabel(c.channel)}</div>
                      </div>
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColor(c.status)}`}>
                        {c.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="text-gray-700 dark:text-gray-300">
                        <span className="font-medium text-gray-900 dark:text-gray-100">Budget:</span>{' '}
                        MWK {Number(c.budget || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </div>
                      <div className="text-gray-700 dark:text-gray-300">
                        <span className="font-medium text-gray-900 dark:text-gray-100">Audience:</span>{' '}
                        <span className="break-words">{c.target_audience || '—'}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <button
                        type="button"
                        onClick={() => openView(c)}
                        className="text-coin-700 dark:text-coin-300 hover:text-coin-600 disabled:opacity-50"
                        disabled={loadingId === c.id}
                      >
                        {loadingId === c.id ? 'Opening…' : 'View'}
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(c)}
                        className="text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(c)}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-gray-500 dark:text-gray-400 text-sm">No campaigns yet.</div>
              )}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-[900px] w-full text-xs">
                <thead className="bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">Name</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">Channel</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">Audience</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-600 dark:text-gray-300">Budget</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">Status</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {campaigns?.data?.length ? (
                    campaigns.data.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                        <td className="px-3 py-2 text-gray-900 dark:text-gray-100 max-w-xs truncate">{c.name}</td>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-200">{channelLabel(c.channel)}</td>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-200 max-w-xs truncate">
                          {c.target_audience || '—'}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-900 dark:text-gray-100">
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
                              className="text-coin-700 dark:text-coin-300 hover:text-coin-600 disabled:opacity-50"
                              disabled={loadingId === c.id}
                            >
                              {loadingId === c.id ? 'Opening…' : 'View'}
                            </button>
                            <button
                              type="button"
                              onClick={() => openEdit(c)}
                              className="text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(c)}
                              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-3 py-6 text-center text-gray-500 dark:text-gray-400">
                        No campaigns yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {(campaigns?.meta?.last_page ?? 1) > 1 && (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {(campaigns?.links ?? []).map((link: any, idx: number) => (
                  <Link
                    key={idx}
                    href={link.url || '#'}
                    className={`px-3 py-1 rounded text-xs ${
                      link.active
                        ? 'bg-coin-700 text-white'
                        : 'bg-white dark:bg-gray-900/60 text-gray-700 dark:text-gray-100 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/60'
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
    </MarketingLayout>
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
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-950">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">New Campaign</h2>
        <button
          type="button"
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200"
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
      <div className="px-6 py-4 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <form className="grid grid-cols-1 sm:grid-cols-2 gap-4" onSubmit={handleSubmit}>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
            <input
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-coin-500 focus:ring-1 focus:ring-coin-500"
              value={data.name}
              onChange={(e) => setData('name', e.target.value)}
            />
            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Channel</label>
            <select
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-coin-500 focus:ring-1 focus:ring-coin-500"
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-coin-500 focus:ring-1 focus:ring-coin-500"
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Budget (MWK)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-coin-500 focus:ring-1 focus:ring-coin-500"
              value={data.budget}
              onChange={(e) => setData('budget', e.target.value)}
            />
            {errors.budget && <p className="text-sm text-red-600">{errors.budget}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
            <input
              type="date"
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-coin-500 focus:ring-1 focus:ring-coin-500"
              value={data.start_date}
              onChange={(e) => setData('start_date', e.target.value)}
            />
            {errors.start_date && <p className="text-sm text-red-600">{errors.start_date}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
            <input
              type="date"
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-coin-500 focus:ring-1 focus:ring-coin-500"
              value={data.end_date}
              onChange={(e) => setData('end_date', e.target.value)}
            />
            {errors.end_date && <p className="text-sm text-red-600">{errors.end_date}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Audience</label>
            <input
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-coin-500 focus:ring-1 focus:ring-coin-500"
              value={data.target_audience}
              onChange={(e) => setData('target_audience', e.target.value)}
              placeholder="e.g. Existing clients in Lilongwe, new SME prospects"
            />
            {errors.target_audience && (
              <p className="text-sm text-red-600">{errors.target_audience}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Objective</label>
            <textarea
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-coin-500 focus:ring-1 focus:ring-coin-500"
              rows={2}
              value={data.objective}
              onChange={(e) => setData('objective', e.target.value)}
              placeholder="e.g. Drive renewals, acquire new clients, upsell additional guards"
            />
            {errors.objective && <p className="text-sm text-red-600">{errors.objective}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
            <textarea
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-coin-500 focus:ring-1 focus:ring-coin-500"
              rows={3}
              value={data.notes}
              onChange={(e) => setData('notes', e.target.value)}
            />
            {errors.notes && <p className="text-sm text-red-600">{errors.notes}</p>}
          </div>

          <div className="sm:col-span-2 flex flex-col sm:flex-row justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="w-full sm:w-auto px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
              disabled={processing}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing}
              className="w-full sm:w-auto px-4 py-2 text-sm rounded-md bg-coin-700 text-white hover:bg-coin-600 disabled:bg-gray-400"
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
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-950">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Campaign</h2>
        <button
          type="button"
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200"
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
      <div className="px-6 py-4 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <form className="grid grid-cols-1 sm:grid-cols-2 gap-4" onSubmit={handleSubmit}>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
            <input
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-coin-500 focus:ring-1 focus:ring-coin-500"
              value={data.name}
              onChange={(e) => setData('name', e.target.value)}
            />
            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Channel</label>
            <select
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-coin-500 focus:ring-1 focus:ring-coin-500"
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-coin-500 focus:ring-1 focus:ring-coin-500"
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Budget (MWK)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-coin-500 focus:ring-1 focus:ring-coin-500"
              value={data.budget}
              onChange={(e) => setData('budget', e.target.value)}
            />
            {errors.budget && <p className="text-sm text-red-600">{errors.budget}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
            <input
              type="date"
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-coin-500 focus:ring-1 focus:ring-coin-500"
              value={data.start_date}
              onChange={(e) => setData('start_date', e.target.value)}
            />
            {errors.start_date && <p className="text-sm text-red-600">{errors.start_date}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
            <input
              type="date"
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-coin-500 focus:ring-1 focus:ring-coin-500"
              value={data.end_date}
              onChange={(e) => setData('end_date', e.target.value)}
            />
            {errors.end_date && <p className="text-sm text-red-600">{errors.end_date}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Audience</label>
            <input
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-coin-500 focus:ring-1 focus:ring-coin-500"
              value={data.target_audience}
              onChange={(e) => setData('target_audience', e.target.value)}
              placeholder="e.g. Existing clients in Lilongwe, new SME prospects"
            />
            {errors.target_audience && (
              <p className="text-sm text-red-600">{errors.target_audience}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Objective</label>
            <textarea
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-coin-500 focus:ring-1 focus:ring-coin-500"
              rows={2}
              value={data.objective}
              onChange={(e) => setData('objective', e.target.value)}
              placeholder="e.g. Drive renewals, acquire new clients, upsell additional guards"
            />
            {errors.objective && <p className="text-sm text-red-600">{errors.objective}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
            <textarea
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:border-coin-500 focus:ring-1 focus:ring-coin-500"
              rows={3}
              value={data.notes}
              onChange={(e) => setData('notes', e.target.value)}
            />
            {errors.notes && <p className="text-sm text-red-600">{errors.notes}</p>}
          </div>

          <div className="sm:col-span-2 flex flex-col sm:flex-row justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="w-full sm:w-auto px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
              disabled={processing}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing}
              className="w-full sm:w-auto px-4 py-2 text-sm rounded-md bg-coin-700 text-white hover:bg-coin-600 disabled:bg-gray-400"
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
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-950">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Campaign • {campaign.name}</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200"
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
      <div className="px-6 py-4 bg-white dark:bg-gray-950 space-y-4 text-sm text-gray-900 dark:text-gray-100">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="font-medium text-gray-700 dark:text-gray-300">Channel</div>
            <div className="text-gray-900 dark:text-gray-100">{channelLabel(campaign.channel)}</div>
          </div>
          <div>
            <div className="font-medium text-gray-700 dark:text-gray-300">Status</div>
            <span className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColor(campaign.status)}`}>
              {campaign.status}
            </span>
          </div>
          <div>
            <div className="font-medium text-gray-700 dark:text-gray-300">Budget</div>
            <div className="text-gray-900 dark:text-gray-100">
              MWK {Number(campaign.budget || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-700 dark:text-gray-300">Dates</div>
            <div className="text-gray-900 dark:text-gray-100">
              {campaign.start_date?.slice(0, 10) || '—'}
              {' '}–{' '}
              {campaign.end_date?.slice(0, 10) || '—'}
            </div>
          </div>
        </div>

        {campaign.target_audience && (
          <div>
            <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">Target Audience</div>
            <div className="text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 rounded px-3 py-2 whitespace-pre-wrap">
              {campaign.target_audience}
            </div>
          </div>
        )}

        {campaign.objective && (
          <div>
            <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">Objective</div>
            <div className="text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 rounded px-3 py-2 whitespace-pre-wrap">
              {campaign.objective}
            </div>
          </div>
        )}

        {campaign.notes && (
          <div>
            <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</div>
            <div className="text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 rounded px-3 py-2 whitespace-pre-wrap">
              {campaign.notes}
            </div>
          </div>
        )}
      </div>
      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 flex justify-end text-sm">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-md bg-coin-700 text-white hover:bg-coin-600"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}
