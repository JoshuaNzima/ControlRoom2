import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import type { PageProps } from '@/types';

interface SummaryResponse {
  my_open: number;
  my_needs_revision: number;
  pending_admin: number;
  pending_disbursement: number;
}

interface Props {
  className?: string;
}

export default function RequisitionSummary({ className = '' }: Props) {
  const { auth } = usePage<PageProps>().props;
  const roles = (auth.user.roles ?? []) as string[];

  const [summary, setSummary] = React.useState<SummaryResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(false);

        const response = await fetch(route('requisitions.summary'));
        if (!response.ok) throw new Error('Failed to load requisitions summary');
        const json = (await response.json()) as SummaryResponse;
        if (!cancelled) setSummary(json);
      } catch (e) {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div
        className={`rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 text-xs text-gray-500 dark:text-gray-400 ${className}`}
      >
        Loading requisitions


      </div>
    );
  }

  if (error || !summary) {
    return null;
  }

  const showAdmin = (roles.includes('admin') || roles.includes('super_admin')) && summary.pending_admin > 0;
  const showAsset =
    (roles.includes('asset_manager') || roles.includes('assets_manager') || roles.includes('super_admin')) &&
    summary.pending_disbursement > 0;

  return (
    <div
      className={`rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center ${className}`}
    >
      <div className="space-y-1">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Requisitions overview
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="inline-flex items-center rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200 px-2.5 py-1">
            <span className="mr-1 h-1.5 w-1.5 rounded-full bg-indigo-500" />
            My open:
            <span className="ml-1 font-semibold">{summary.my_open}</span>
          </span>
          {summary.my_needs_revision > 0 && (
            <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 px-2.5 py-1">
              <span className="mr-1 h-1.5 w-1.5 rounded-full bg-amber-500" />
              Needs revision:
              <span className="ml-1 font-semibold">{summary.my_needs_revision}</span>
            </span>
          )}
          {showAdmin && (
            <span className="inline-flex items-center rounded-full bg-rose-50 text-rose-800 dark:bg-rose-900/50 dark:text-rose-100 px-2.5 py-1">
              <span className="mr-1 h-1.5 w-1.5 rounded-full bg-rose-500" />
              Pending your approval:
              <span className="ml-1 font-semibold">{summary.pending_admin}</span>
            </span>
          )}
          {showAsset && (
            <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100 px-2.5 py-1">
              <span className="mr-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Pending disbursement:
              <span className="ml-1 font-semibold">{summary.pending_disbursement}</span>
            </span>
          )}
        </div>
      </div>
      <Link
        href={route('requisitions.index')}
        className="inline-flex items-center text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-300 dark:hover:text-red-200"
      >
        View requisitions
      </Link>
    </div>
  );
}
