import React from 'react';
import Modal from '@/Components/Modal';
import { Button } from '@/Components/ui/button';
import IconMapper from '@/Components/IconMapper';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function RequisitionReportModal({ open, onClose }: Props) {
  const [month, setMonth] = React.useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = React.useState<number>(new Date().getFullYear());
  const [format, setFormat] = React.useState<'csv' | 'json'>('csv');
  const [loading, setLoading] = React.useState(false);
  const [preview, setPreview] = React.useState<any>(null);

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);

  const loadPreview = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${route('requisitions.batches.report')}?month=${month}&year=${year}&format=json`,
        {
          headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setPreview(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    const url = `${route('requisitions.batches.report')}?month=${month}&year=${year}&format=${format}`;
    window.location.href = url;
  };

  React.useEffect(() => {
    if (!open) {
      setPreview(null);
      return;
    }
    loadPreview();
  }, [open, month, year]);

  return (
    <Modal show={open} onClose={onClose} maxWidth="2xl">
      <div className="p-4 sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
              Requisition Report
            </h2>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              Generate monthly reports with summary statistics.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Close
          </button>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60 p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">
                Month
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-2.5 py-1.5 text-xs text-gray-900 dark:text-gray-100"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">
                Year
              </label>
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-2.5 py-1.5 text-xs text-gray-900 dark:text-gray-100"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">
                Format
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as 'csv' | 'json')}
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-2.5 py-1.5 text-xs text-gray-900 dark:text-gray-100"
              >
                <option value="csv">CSV Download</option>
                <option value="json">JSON Preview</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="mt-4 p-4 text-center text-sm text-gray-500">Loading preview...</div>
        ) : preview ? (
          <div className="mt-4 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="px-3 sm:px-4 py-2 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
              <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {preview.period} Summary
              </h3>
            </div>
            <div className="p-3 sm:p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="rounded-lg bg-gray-50 dark:bg-gray-900/50 p-2">
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">Total Requisitions</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {preview.summary?.total_requisitions ?? 0}
                  </div>
                </div>
                <div className="rounded-lg bg-gray-50 dark:bg-gray-900/50 p-2">
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">Total Amount</div>
                  <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                    K{(preview.summary?.total_amount ?? 0).toLocaleString()}
                  </div>
                </div>
                <div className="rounded-lg bg-gray-50 dark:bg-gray-900/50 p-2">
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">Batches</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {preview.summary?.total_batches ?? 0}
                  </div>
                </div>
                <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-2">
                  <div className="text-[10px] text-yellow-600 dark:text-yellow-400">Pending Admin</div>
                  <div className="text-lg font-semibold text-yellow-700 dark:text-yellow-300">
                    {preview.summary?.pending_admin ?? 0}
                  </div>
                </div>
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-2">
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400">Disbursed</div>
                  <div className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
                    {preview.summary?.disbursed ?? 0}
                  </div>
                </div>
                <div className="rounded-lg bg-rose-50 dark:bg-rose-900/20 p-2">
                  <div className="text-[10px] text-rose-600 dark:text-rose-400">Needs Revision</div>
                  <div className="text-lg font-semibold text-rose-700 dark:text-rose-300">
                    {preview.summary?.needs_revision ?? 0}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={loadPreview} disabled={loading}>
            <IconMapper name="RefreshCw" size={12} className="mr-1.5" />
            Refresh
          </Button>
          <Button variant="default" size="sm" onClick={downloadReport} disabled={loading}>
            <IconMapper name="Download" size={12} className="mr-1.5" />
            Download {format.toUpperCase()}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
