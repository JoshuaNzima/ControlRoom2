import React, { useState, useEffect, useMemo } from 'react';
import Modal from '@/Components/Modal';
import useToast from '@/Components/ui/use-toast';
import { useForm, router } from '@inertiajs/react';

type Guard = { id: number; name: string; employee_id?: string; default_off_day?: number | null };
type Site = { id: number; name: string };
type ShiftType = 'day' | 'night' | 'morning' | 'evening' | 'custom';

interface ManualRosterEntryModalProps {
  open: boolean;
  onClose: () => void;
  guards: Guard[];
  sites: Site[];
  onSaved: () => void;
  initialDate?: string;
  initialGuardId?: number;
  weekStart?: string;
}

export default function ManualRosterEntryModal({
  open,
  onClose,
  guards,
  sites,
  onSaved,
  initialDate,
  initialGuardId,
  weekStart,
}: ManualRosterEntryModalProps) {
  const { toast } = useToast();
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [entryType, setEntryType] = useState<'work' | 'off'>('work');
  const [selectedGuardIds, setSelectedGuardIds] = useState<number[]>([]);
  const [selectedDayIndices, setSelectedDayIndices] = useState<number[]>([]);

  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  function getWeekDates(weekStartStr?: string): string[] {
    const start = weekStartStr ? new Date(weekStartStr) : new Date();
    const day = start.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    const monday = new Date(start);
    monday.setDate(start.getDate() + diff);
    monday.setHours(0, 0, 0, 0);

    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  }

  const weekDates = getWeekDates(weekStart);

  const { data, setData, post, processing, errors, reset } = useForm<{
    guard_id: number | '';
    dates: string[];
    guard_ids: number[];
    date: string;
    entry_type: 'work' | 'off';
    client_site_id: number | '';
    start_time: string;
    end_time: string;
    shift_type: ShiftType;
    notes: string;
  }>({
    guard_id: initialGuardId || '',
    dates: [],
    guard_ids: [],
    date: initialDate || new Date().toISOString().split('T')[0],
    entry_type: 'work',
    client_site_id: '',
    start_time: '06:00',
    end_time: '18:00',
    shift_type: 'day',
    notes: '',
  });

  useEffect(() => {
    if (open) {
      reset();
      setMode('single');
      setEntryType('work');
      setSelectedGuardIds([]);
      setSelectedDayIndices([]);
      setData('date', initialDate || new Date().toISOString().split('T')[0]);
      setData('guard_id', initialGuardId || '');
    }
  }, [open, initialDate, initialGuardId, reset, setData]);

  useEffect(() => {
    setData('entry_type', entryType);
  }, [entryType, setData]);

  const toggleGuard = (id: number) => {
    setSelectedGuardIds(prev =>
      prev.includes(id) ? prev.filter(gid => gid !== id) : [...prev, id]
    );
  };

  const toggleDay = (idx: number) => {
    setSelectedDayIndices(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const selectAllDays = () => {
    setSelectedDayIndices([0, 1, 2, 3, 4, 5, 6]);
  };

  const clearDaySelection = () => {
    setSelectedDayIndices([]);
  };

  const selectedGuard = (() => {
    if (mode === 'single') {
      return guards.find(g => g.id === data.guard_id);
    }
    if (selectedGuardIds.length === 1) {
      return guards.find(g => g.id === selectedGuardIds[0]);
    }
    return undefined;
  })();

  const defaultOffDayIndex = selectedGuard?.default_off_day ?? null;

  const selectDefaultOffDay = () => {
    if (defaultOffDayIndex !== null && defaultOffDayIndex !== undefined) {
      setSelectedDayIndices([defaultOffDayIndex]);
    }
  };

  const getSelectedDates = (): string[] => {
    if (mode === 'single') {
      return [data.date];
    }
    return selectedDayIndices.map(idx => weekDates[idx]).filter(Boolean);
  };

  const selectAllGuards = () => {
    setSelectedGuardIds(guards.map(g => g.id));
  };

  const clearGuardSelection = () => {
    setSelectedGuardIds([]);
  };

  const applyPreset = (preset: 'day' | 'night' | 'morning' | 'evening') => {
    const presets: Record<string, { start: string; end: string; type: ShiftType }> = {
      day: { start: '06:00', end: '18:00', type: 'day' },
      night: { start: '18:00', end: '06:00', type: 'night' },
      morning: { start: '06:00', end: '14:00', type: 'morning' },
      evening: { start: '14:00', end: '22:00', type: 'evening' },
    };
    const p = presets[preset];
    setData('start_time', p.start);
    setData('end_time', p.end);
    setData('shift_type', p.type);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'single') {
      if (!data.guard_id) {
        toast({ title: 'Select a guard', variant: 'destructive' });
        return;
      }
      post(route('control-room.roster.manual-entry'), {
        onSuccess: () => {
          toast({ title: 'Roster entry saved' });
          onSaved();
          onClose();
        },
        onError: (err) => {
          toast({ title: err.date || err.start_time || err.client_site_id || 'Failed to save', variant: 'destructive' });
        },
      });
    } else {
      if (selectedGuardIds.length === 0) {
        toast({ title: 'Select at least one guard', variant: 'destructive' });
        return;
      }
      const dates = getSelectedDates();
      if (dates.length === 0) {
        toast({ title: 'Select at least one day', variant: 'destructive' });
        return;
      }
      router.post(route('control-room.roster.manual-entry-bulk'), {
        guard_ids: selectedGuardIds,
        dates: dates,
        entry_type: entryType,
        client_site_id: data.client_site_id || undefined,
        start_time: entryType === 'work' ? data.start_time : undefined,
        end_time: entryType === 'work' ? data.end_time : undefined,
        shift_type: entryType === 'work' ? data.shift_type : undefined,
        notes: data.notes || undefined,
      }, {
        onSuccess: () => {
          toast({ title: 'Bulk roster entries saved' });
          onSaved();
          onClose();
        },
        onError: () => {
          toast({ title: 'Failed to save some entries', variant: 'destructive' });
        },
      });
    }
  };

  const workFields = (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Site</label>
        <select
          value={data.client_site_id}
          onChange={(e) => setData('client_site_id', Number(e.target.value))}
          className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
        >
          <option value="">Select site</option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        {errors.client_site_id && <p className="text-xs text-red-600 mt-1">{errors.client_site_id}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Time</label>
          <input
            type="time"
            value={data.start_time}
            onChange={(e) => setData('start_time', e.target.value)}
            className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Time</label>
          <input
            type="time"
            value={data.end_time}
            onChange={(e) => setData('end_time', e.target.value)}
            className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Shift Type</label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => applyPreset('day')}
            className={`px-3 py-1.5 rounded-md text-sm ${data.shift_type === 'day' && data.start_time === '06:00' ? 'bg-coin-700 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
          >
            Day (6-18)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('night')}
            className={`px-3 py-1.5 rounded-md text-sm ${data.shift_type === 'night' && data.start_time === '18:00' ? 'bg-coin-700 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
          >
            Night (18-6)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('morning')}
            className={`px-3 py-1.5 rounded-md text-sm ${data.shift_type === 'morning' ? 'bg-coin-700 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
          >
            Morning
          </button>
          <button
            type="button"
            onClick={() => applyPreset('evening')}
            className={`px-3 py-1.5 rounded-md text-sm ${data.shift_type === 'evening' ? 'bg-coin-700 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
          >
            Evening
          </button>
        </div>
        <input type="hidden" value={data.shift_type} />
      </div>
    </div>
  );

  const singleMode = (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Guard</label>
        <select
          value={data.guard_id}
          onChange={(e) => setData('guard_id', Number(e.target.value))}
          className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
        >
          <option value="">Select guard</option>
          {guards.map((g) => (
            <option key={g.id} value={g.id}>{g.name} {g.employee_id ? `(${g.employee_id})` : ''}</option>
          ))}
        </select>
        {errors.guard_id && <p className="text-xs text-red-600 mt-1">{errors.guard_id}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
        <input
          type="date"
          value={data.date}
          onChange={(e) => setData('date', e.target.value)}
          className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
        />
        {errors.date && <p className="text-xs text-red-600 mt-1">{errors.date}</p>}
      </div>

      <div className="flex items-center gap-4">
        <label className="inline-flex items-center gap-2">
          <input
            type="radio"
            checked={entryType === 'work'}
            onChange={() => setEntryType('work')}
            className="text-coin-600"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Work</span>
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="radio"
            checked={entryType === 'off'}
            onChange={() => setEntryType('off')}
            className="text-coin-600"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Off Day</span>
        </label>
      </div>

      {entryType === 'work' && workFields}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes (optional)</label>
        <textarea
          value={data.notes}
          onChange={(e) => setData('notes', e.target.value)}
          rows={2}
          className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
          placeholder="Add any notes..."
        />
      </div>
    </div>
  );

  const bulkMode = (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Guards ({selectedGuardIds.length} selected)</label>
        <div className="border rounded-md p-2 dark:border-gray-700 max-h-32 overflow-auto">
          <div className="flex flex-wrap gap-2 mb-2">
            <button
              type="button"
              onClick={selectAllGuards}
              className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={clearGuardSelection}
              className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            >
              Clear
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {guards.map((g) => (
              <label key={g.id} className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={selectedGuardIds.includes(g.id)}
                  onChange={() => toggleGuard(g.id)}
                  className="rounded border-gray-300 dark:border-gray-600"
                />
                <span className="truncate">{g.name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Days ({selectedDayIndices.length} selected)
          </label>
          <div className="flex gap-1">
            {defaultOffDayIndex !== null && defaultOffDayIndex !== undefined && mode === 'bulk' && entryType === 'off' && (
              <button
                type="button"
                onClick={selectDefaultOffDay}
                className="text-xs px-2 py-1 rounded bg-coin-100 dark:bg-coin-900/30 text-coin-700 dark:text-coin-300"
              >
                Default ({DAY_LABELS[defaultOffDayIndex]})
              </button>
            )}
            <button
              type="button"
              onClick={selectAllDays}
              className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            >
              All
            </button>
            <button
              type="button"
              onClick={clearDaySelection}
              className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            >
              Clear
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {DAY_LABELS.map((label, idx) => {
            const isSelected = selectedDayIndices.includes(idx);
            const isDefaultOff = defaultOffDayIndex === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => toggleDay(idx)}
                className={`
                  flex flex-col items-center justify-center p-2 rounded-md border text-xs transition-colors
                  ${isSelected
                    ? 'bg-coin-700 text-white border-coin-700'
                    : isDefaultOff
                      ? 'bg-coin-50 dark:bg-coin-900/20 text-coin-700 dark:text-coin-300 border-coin-200 dark:border-coin-800'
                      : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }
                `}
                title={DAY_FULL[idx]}
              >
                <span className="font-semibold">{label}</span>
                <span className="text-[10px] opacity-80">{weekDates[idx]?.slice(5)}</span>
              </button>
            );
          })}
        </div>
        {defaultOffDayIndex !== null && defaultOffDayIndex !== undefined && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Default off day: {DAY_FULL[defaultOffDayIndex]}
          </p>
        )}
      </div>

      <div className="flex items-center gap-4">
        <label className="inline-flex items-center gap-2">
          <input
            type="radio"
            checked={entryType === 'work'}
            onChange={() => setEntryType('work')}
            className="text-coin-600"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Work</span>
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="radio"
            checked={entryType === 'off'}
            onChange={() => setEntryType('off')}
            className="text-coin-600"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Off Day</span>
        </label>
      </div>

      {entryType === 'work' && workFields}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes (optional)</label>
        <textarea
          value={data.notes}
          onChange={(e) => setData('notes', e.target.value)}
          rows={2}
          className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
          placeholder="Add any notes..."
        />
      </div>
    </div>
  );

  return (
    <Modal show={open} onClose={onClose} maxWidth="lg">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Manual Roster Entry</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200">✕</button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <form onSubmit={submit} className="space-y-4">
          <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-md">
            <button
              type="button"
              onClick={() => setMode('single')}
              className={`flex-1 px-3 py-1.5 rounded-md text-sm ${mode === 'single' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-600 dark:text-gray-400'}`}
            >
              Single Entry
            </button>
            <button
              type="button"
              onClick={() => setMode('bulk')}
              className={`flex-1 px-3 py-1.5 rounded-md text-sm ${mode === 'bulk' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-600 dark:text-gray-400'}`}
            >
              Bulk Entry
            </button>
          </div>

          {mode === 'single' ? singleMode : bulkMode}

          <div className="flex justify-end gap-2 pt-4 border-t dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
              disabled={processing}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing}
              className="px-4 py-2 text-sm rounded-md bg-coin-700 text-white hover:bg-coin-600 disabled:opacity-50"
            >
              {processing ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
