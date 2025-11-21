<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Models\PayrollRun;
use App\Models\PayrollEntry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PayrollRunController extends Controller
{
    public function index()
    {
        $runs = PayrollRun::orderByDesc('created_at')->paginate(15);
        return Inertia::render('Finance/Payroll/Index', [
            'runs' => $runs,
        ]);
    }

    public function create()
    {
        return Inertia::render('Finance/Payroll/Create');
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'period_start' => 'required|date',
            'period_end' => 'required|date|after_or_equal:period_start',
        ]);

        $run = PayrollRun::create([
            'period_start' => $data['period_start'],
            'period_end' => $data['period_end'],
            'status' => 'draft',
            'created_by' => Auth::id(),
        ]);

        return redirect()->route('finance.payroll.show', $run);
    }

    public function show(PayrollRun $payroll)
    {
        $payroll->load('entries');
        return Inertia::render('Finance/Payroll/Show', [
            'run' => $payroll,
        ]);
    }

    public function process(PayrollRun $payroll)
    {
        // Clear existing entries to allow re-processing
        $payroll->entries()->delete();

        $start = $payroll->period_start ?: now()->startOfMonth();
        $end = $payroll->period_end ?: now()->endOfMonth();
        $daysInPeriod = $start->diffInDays($end) + 1;

        $grossTotal = 0; $netTotal = 0; $deductionsTotal = 0;

        // Load payroll defaults for fallbacks
        $defaults = [
            'overtime_multiplier_default' => 1.5,
            'guard_absence_deduction_per_day' => 0,
            'staff_absence_deduction_per_day' => 0,
        ];
        try {
            $defaultsRow = \App\Models\Setting::where('key', 'finance.payroll.defaults')->first();
            if ($defaultsRow && is_array($defaultsRow->value)) {
                $defaults = array_merge($defaults, $defaultsRow->value);
            }
        } catch (\Throwable $e) {}

        // Process all defined pay profiles (guards and staff)
        $profiles = \App\Models\PayProfile::query()->get();
        foreach ($profiles as $profile) {
            $payeeType = $profile->payee_type; // 'guard' | 'user'
            $payeeId = $profile->payee_id;
            $monthly = (float) $profile->monthly_salary;
            $otMultiplier = (float) ($profile->overtime_multiplier ?: ($defaults['overtime_multiplier_default'] ?? 1.5));
            $advance = (float) ($profile->advance_amount ?: 0);
            $allowancesRaw = $profile->allowances ?? [];
            $absenceDeductionPerDay = (float) (
                $profile->absence_deduction_per_day
                    ?: (
                        $payeeType === 'guard'
                            ? ($defaults['guard_absence_deduction_per_day'] ?? 0)
                            : ($defaults['staff_absence_deduction_per_day'] ?? 0)
                    )
            );

            // Compute allowances sum (support array or map)
            $allowancesSum = 0.0;
            if (is_array($allowancesRaw)) {
                if (array_is_list($allowancesRaw)) {
                    foreach ($allowancesRaw as $a) {
                        if (is_array($a) && isset($a['amount'])) $allowancesSum += (float) $a['amount'];
                        elseif (is_numeric($a)) $allowancesSum += (float) $a;
                    }
                } else {
                    foreach ($allowancesRaw as $k => $v) {
                        if (is_numeric($v)) $allowancesSum += (float) $v;
                        elseif (is_array($v) && isset($v['amount'])) $allowancesSum += (float) $v['amount'];
                    }
                }
            }

            $dayHours = $payeeType === 'guard' ? 12 : 8; // per requirements
            $standardHours = max(1, $dayHours * $daysInPeriod);
            $hourlyRate = $monthly / $standardHours;

            $overtimeHours = 0.0;
            $absentDays = 0;
            if ($payeeType === 'guard') {
                try {
                    $overtimeHours = (float) \App\Models\Guards\Attendance::where('guard_id', $payeeId)
                        ->whereBetween('date', [$start->toDateString(), $end->toDateString()])
                        ->sum('overtime_hours');
                    $absentDays = (int) \App\Models\Guards\Attendance::where('guard_id', $payeeId)
                        ->whereBetween('date', [$start->toDateString(), $end->toDateString()])
                        ->where('status', 'absent')
                        ->count();
                } catch (\Throwable $e) {
                    $overtimeHours = 0.0; $absentDays = 0;
                }
            } else {
                // Staff overtime not tracked yet; default to 0 (can be edited manually later)
                $overtimeHours = 0.0;
            }

            $overtimeAmount = $overtimeHours * $hourlyRate * $otMultiplier;
            $absenceDeduction = $absentDays * $absenceDeductionPerDay;

            $gross = $monthly + $allowancesSum + $overtimeAmount;
            $deductions = $advance + $absenceDeduction;
            $net = $gross - $deductions;

            $entry = $payroll->entries()->create([
                'payee_type' => $payeeType,
                'payee_id' => $payeeId,
                'base_amount' => $monthly,
                'allowances' => [
                    'task_allowances' => $allowancesRaw,
                    'overtime' => round($overtimeAmount, 2),
                ],
                'deductions' => [
                    'advance' => round($advance, 2),
                    'absence' => round($absenceDeduction, 2),
                ],
                'gross' => round($gross, 2),
                'net' => round($net, 2),
                'notes' => null,
            ]);

            $grossTotal += (float) $entry->gross;
            $netTotal += (float) $entry->net;
            $deductionsTotal += (float) (($entry->deductions['advance'] ?? 0) + ($entry->deductions['absence'] ?? 0));
        }

        $payroll->update([
            'gross_total' => round($grossTotal, 2),
            'deductions_total' => round($deductionsTotal, 2),
            'net_total' => round($netTotal, 2),
            'status' => 'processed',
        ]);

        return back()->withSuccess('Payroll run processed.');
    }

    public function updateEntry(PayrollEntry $entry, Request $request)
    {
        $data = $request->validate([
            'overtime_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $allowances = $entry->allowances ?? [];
        $taskAllowances = [];
        if (is_array($allowances)) {
            $taskAllowances = $allowances['task_allowances'] ?? [];
        } else {
            $allowances = [];
        }

        $overtimeAmount = isset($data['overtime_amount'])
            ? (float) $data['overtime_amount']
            : (float) ($allowances['overtime'] ?? 0);

        $allowances['overtime'] = round($overtimeAmount, 2);
        if (!isset($allowances['task_allowances'])) {
            $allowances['task_allowances'] = $taskAllowances;
        }

        $allowancesSum = 0.0;
        if (is_array($taskAllowances)) {
            if (array_is_list($taskAllowances)) {
                foreach ($taskAllowances as $a) {
                    if (is_array($a) && isset($a['amount'])) $allowancesSum += (float) $a['amount'];
                    elseif (is_numeric($a)) $allowancesSum += (float) $a;
                }
            } else {
                foreach ($taskAllowances as $k => $v) {
                    if (is_numeric($v)) $allowancesSum += (float) $v;
                    elseif (is_array($v) && isset($v['amount'])) $allowancesSum += (float) $v['amount'];
                }
            }
        }
        $allowancesSum += $overtimeAmount;

        $base = (float) $entry->base_amount;
        $deductions = $entry->deductions ?? [];
        $advance = (float) ($deductions['advance'] ?? 0);
        $absence = (float) ($deductions['absence'] ?? 0);
        $deductionsTotal = $advance + $absence;

        $gross = $base + $allowancesSum;
        $net = $gross - $deductionsTotal;

        $entry->update([
            'allowances' => $allowances,
            'gross' => round($gross, 2),
            'net' => round($net, 2),
            'notes' => $data['notes'] ?? $entry->notes,
        ]);

        $run = $entry->run()->with('entries')->first();
        $grossTotal = (float) $run->entries->sum('gross');
        $netTotal = (float) $run->entries->sum('net');
        $deductionsTotal = 0.0;
        foreach ($run->entries as $e) {
            $deductionsTotal += (float) (($e->deductions['advance'] ?? 0) + ($e->deductions['absence'] ?? 0));
        }
        $run->update([
            'gross_total' => round($grossTotal, 2),
            'deductions_total' => round($deductionsTotal, 2),
            'net_total' => round($netTotal, 2),
        ]);

        return back()->withSuccess('Entry updated.');
    }
}
