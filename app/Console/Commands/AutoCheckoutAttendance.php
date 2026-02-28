<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Guards\Attendance;
use App\Models\Guards\Shift;
use Carbon\Carbon;

class AutoCheckoutAttendance extends Command
{
    protected $signature = 'attendance:auto-checkout {--hours=12 : Hours threshold before auto checkout}';

    protected $description = 'Automatically check out guards after a specified number of hours (default 12).';

    public function handle(): int
    {
        $hours = (int) $this->option('hours');
        if ($hours < 1) { $hours = 12; }

        $now = now();
        $count = 0;

        Attendance::query()
            ->whereNull('check_out_time')
            ->whereNotNull('check_in_time')
            ->whereDate('date', '>=', $now->copy()->subDays(7)->toDateString())
            ->orderBy('id')
            ->chunkById(200, function ($rows) use (&$count, $hours, $now) {
                foreach ($rows as $attendance) {
                    $dateString = $attendance->date?->toDateString() ?: (string) $attendance->getRawOriginal('date');
                    $rawCheckIn = $attendance->getRawOriginal('check_in_time') ?: null;

                    if (!$dateString || !$rawCheckIn) {
                        continue;
                    }

                    try {
                        $rawCheckInString = trim((string) $rawCheckIn);
                        if (str_contains($rawCheckInString, '-') || str_contains($rawCheckInString, 'T')) {
                            $checkInAt = Carbon::parse($rawCheckInString);
                        } else {
                            $parts = preg_split('/\s+/', $rawCheckInString);
                            $timePart = $parts ? (string) end($parts) : $rawCheckInString;
                            $checkInAt = Carbon::parse($dateString.' '.$timePart);
                        }
                    } catch (\Throwable $e) {
                        continue;
                    }

                    $maxDueAt = $checkInAt->copy()->addHours($hours);
                    $dueAt = $maxDueAt;
                    $reason = 'after '.$hours.'h';

                    $shift = Shift::query()
                        ->where('guard_id', $attendance->guard_id)
                        ->whereDate('date', $dateString)
                        ->when($attendance->client_site_id, function ($q) use ($attendance) {
                            $q->where('client_site_id', $attendance->client_site_id);
                        })
                        ->whereNotIn('status', ['cancelled', 'missed'])
                        ->orderBy('start_time')
                        ->first();

                    if ($shift) {
                        $shiftDateString = $shift->date?->toDateString() ?: (string) $shift->getRawOriginal('date');
                        $rawStart = $shift->getRawOriginal('start_time') ?: null;
                        $rawEnd = $shift->getRawOriginal('end_time') ?: null;

                        if ($shiftDateString && $rawStart && $rawEnd) {
                            try {
                                $rawStartString = trim((string) $rawStart);
                                $rawEndString = trim((string) $rawEnd);

                                if (str_contains($rawStartString, '-') || str_contains($rawStartString, 'T')) {
                                    $startAt = Carbon::parse($rawStartString);
                                } else {
                                    $startParts = preg_split('/\s+/', $rawStartString);
                                    $startTimePart = $startParts ? (string) end($startParts) : $rawStartString;
                                    $startAt = Carbon::parse($shiftDateString.' '.$startTimePart);
                                }

                                if (str_contains($rawEndString, '-') || str_contains($rawEndString, 'T')) {
                                    $endAt = Carbon::parse($rawEndString);
                                } else {
                                    $endParts = preg_split('/\s+/', $rawEndString);
                                    $endTimePart = $endParts ? (string) end($endParts) : $rawEndString;
                                    $endAt = Carbon::parse($shiftDateString.' '.$endTimePart);
                                }

                                if ($endAt->lessThanOrEqualTo($startAt)) {
                                    $endAt = $endAt->addDay();
                                }

                                if ($endAt->lessThan($dueAt)) {
                                    $dueAt = $endAt;
                                    $reason = 'at shift end';
                                }
                            } catch (\Throwable $e) {
                            }
                        }
                    }

                    if ($now->lessThan($dueAt)) {
                        continue;
                    }

                    $attendance->check_out_time = $dueAt;
                    $attendance->check_out_notes = trim(($attendance->check_out_notes ?: '') . ' Auto checkout ' . $reason . ' (no supervisor available)');
                    $attendance->source = 'auto_checkout_no_supervisor';

                    if (method_exists($attendance, 'calculateHours')) {
                        // calculateHours() will save the record
                        $attendance->calculateHours();
                    } else {
                        $attendance->save();
                    }

                    try {
                        event(new \App\Events\AttendanceUpdated($attendance->id, 'Auto check-out after '.$hours.'h (supervisor unavailable)', [
                            'supervisor_id' => $attendance->supervisor_id,
                            'guard_id' => $attendance->guard_id,
                            'client_site_id' => $attendance->client_site_id,
                            'time' => $dueAt->toIso8601String(),
                            'status' => 'auto_checked_out',
                            'reason' => $reason . ' (no supervisor available)',
                            'source' => 'auto_checkout_no_supervisor',
                        ]));
                    } catch (\Throwable $e) {
                        // no-op
                    }

                    $count++;
                }
            });

        $this->info("Auto-checked out {$count} attendance records older than {$hours} hours.");
        return self::SUCCESS;
    }
}
