import React from 'react';
import { Head, Link } from '@inertiajs/react';
import MarketingLayout from '@/Layouts/MarketingLayout';

interface Row { status?: string; count: number; source?: string; ym?: string; total?: number }

interface Props {
  auth?: any;
  campaignsByStatus: Row[];
  leadsBySource: Row[];
  budgetByMonth: Row[];
  conversions: number;
}

export default function MarketingAnalytics({ auth = {}, campaignsByStatus = [], leadsBySource = [], budgetByMonth = [], conversions = 0 }: Props) {
  return (
    <MarketingLayout title="Marketing Analytics" user={auth?.user as any}>
      <Head title="Marketing Analytics" />
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-red-900">Analytics</h1>
              <p className="text-sm text-red-800/80 mt-1">Performance across campaigns and leads.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={route('admin.marketing')} className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-white text-red-800 border border-red-200 hover:bg-red-50">Marketing</Link>
              <Link href={route('admin.marketing.leads.index')} className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-white text-red-800 border border-red-200 hover:bg-red-50">Leads</Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard label="Conversions" value={conversions} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Campaigns by Status">
              <table className="w-full text-sm">
                <thead className="bg-gray-50"><tr><th className="px-3 py-2 text-left">Status</th><th className="px-3 py-2 text-right">Count</th></tr></thead>
                <tbody className="divide-y">
                  {campaignsByStatus.map((r, i) => (
                    <tr key={i}><td className="px-3 py-2">{r.status}</td><td className="px-3 py-2 text-right">{r.count}</td></tr>
                  ))}
                </tbody>
              </table>
            </Card>
            <Card title="Leads by Source">
              <table className="w-full text-sm">
                <thead className="bg-gray-50"><tr><th className="px-3 py-2 text-left">Source</th><th className="px-3 py-2 text-right">Count</th></tr></thead>
                <tbody className="divide-y">
                  {leadsBySource.map((r, i) => (
                    <tr key={i}><td className="px-3 py-2">{r.source || 'Unknown'}</td><td className="px-3 py-2 text-right">{r.count}</td></tr>
                  ))}
                </tbody>
              </table>
            </Card>
            <Card title="Budget by Month">
              <table className="w-full text-sm">
                <thead className="bg-gray-50"><tr><th className="px-3 py-2 text-left">Month</th><th className="px-3 py-2 text-right">Budget</th></tr></thead>
                <tbody className="divide-y">
                  {budgetByMonth.map((r, i) => (
                    <tr key={i}><td className="px-3 py-2">{r.ym}</td><td className="px-3 py-2 text-right">MWK {Number(r.total || 0).toLocaleString()}</td></tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-4 rounded-xl border bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
      <div className="text-sm font-medium text-gray-700">{label}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="mb-4"><h2 className="text-lg font-semibold text-gray-900">{title}</h2></div>
      {children}
    </div>
  );
}
