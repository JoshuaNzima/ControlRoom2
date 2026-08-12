<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Guards\Shift;
use App\Models\Guards\Attendance;
use App\Models\Setting;
use App\Models\User;
use Carbon\Carbon;

class AutoMarkPresentAttendance extends Command
{
    protected $signature = 'attendance:auto-mark-present {--date= : Target date in Y-m-d format (defaults to today)} {--window=10 : Minutes after shift start to still auto-mark present}';

    protected $description = 'Automatically create present attendance records at shift start (auto-present mode).';

    public function handle(): int
    {
        $methods = Setting::getValue('attendance.methods', [
            'auto_absent' => true,
            'auto_present' => false,
        ]);

        // Strict check: only proceed if auto_present is explicitly truthy
        $autoPresent = false;
        if (is_array($methods) && array_key_exists('auto_present', $methods)) {
            $autoPresent = filter_var($methods['auto_present'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? false;
        }

        if (!$autoPresent) {
            $this->info('Auto-present is disabled (setting value: '.json_encode($methods['auto_present'] ?? null).').');
            return self::SUCCESS;
        }

        $dateInput = (string) ($this->option('date') ?? '');
        $windowMinutes = (int) $this->option('window');
        if ($windowMinutes < 1) {
            $windowMinutes = 10;
        }

        try {
            $targetDate = $dateInput ? Carbon::parse($dateInput)->startOfDay() : Carbon::today()->startOfDay();
        } catch (\Throwable $e) {
            $this->error('Invalid date format. Use Y-m-d.');
            return self::FAILURE;
        }

        $dateString = $targetDate->toDateString();
        $now = now();

        $systemUserId = User::query()->min('id');
        if (!$systemUserId) {
            $this->warn('No users found; cannot set supervisor_id for auto-present attendance.');
            return self::SUCCESS;
        }

        $this->info('Running auto-mark present for date: '.$dateString.' (window '.$windowMinutes.'m)');

        $createdCount = 0;

        Shift::query()
            ->whereDate('date', $dateString)
            ->whereNotIn('status', ['cancelled', 'missed'])
            ->orderBy('id')
            ->chunkById(200, function ($shifts) use ($dateString, $now, $windowMinutes, $systemUserId, &$createdCount) {
                foreach ($shifts as $shift) {
                    if (!$shift->guard_id) {
                        continue;
                    }

                    $rawStart = $shift->getRawOriginal('start_time') ?? $shift->start_time;
                    $rawEnd = $shift->getRawOriginal('end_time') ?? $shift->end_time;

                    if (!$rawStart || !$rawEnd) {
                        continue;
                    }

                    try {
                        $startAt = Carbon::parse($dateString.' '.$rawStart);
                        $endAt = Carbon::parse($dateString.' '.$rawEnd);
                        if ($endAt->lessThanOrEqualTo($startAt)) {
                            $endAt = $endAt->addDay();
                        }
                    } catch (\Throwable $e) {
                        continue;
                    }

                    if ($now->lessThan($startAt)) {
                        continue;
                    }

                    if ($now->greaterThan($startAt->copy()->addMinutes($windowMinutes))) {
                        continue;
                    }

                    $hasAttendance = Attendance::where('guard_id', $shift->guard_id)
                        ->whereDate('date', $dateString)
                        ->exists();

                    if ($hasAttendance) {
                        continue;
                    }

                    $attendance = new Attendance([
                        'guard_id' => $shift->guard_id,
                        'supervisor_id' => $systemUserId,
                        'client_site_id' => $shift->client_site_id,
                        'date' => $dateString,
                        'check_in_time' => null,
                        'check_out_time' => null,
                        'hours_worked' => null,
                        'overtime_hours' => 0,
                        'status' => 'present',
                        'check_in_notes' => 'Auto-marked present at shift start (auto-present mode).',
                        'check_out_notes' => null,
                        'backdated' => false,
                        'backdated_reason' => null,
                        'source' => 'auto_present_shift',
                    ]);

                    $attendance->save();
                    $createdCount++;

                    try {
                        event(new \App\Events\AttendanceUpdated($attendance->id, 'Auto-marked present from shift', [
                            'guard_id' => $attendance->guard_id,
                            'client_site_id' => $attendance->client_site_id,
                            'status' => $attendance->status,
                            'date' => $attendance->date?->toDateString(),
                            'source' => $attendance->source,
                        ]));
                    } catch (\Throwable $e) {}
                }
            });

        $this->info("Created {$createdCount} auto-present attendance records.");

        return self::SUCCESS;
    }
}
