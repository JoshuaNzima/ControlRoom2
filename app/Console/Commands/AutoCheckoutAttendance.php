<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Guards\Attendance;
use Carbon\Carbon;

class AutoCheckoutAttendance extends Command
{
    protected $signature = 'attendance:auto-checkout {--hours=12 : Hours threshold before auto checkout}';

    protected $description = 'Automatically check out guards after a specified number of hours (default 12).';

    public function handle(): int
    {
        $hours = (int) $this->option('hours');
        if ($hours < 1) { $hours = 12; }

        $cutoff = Carbon::now()->subHours($hours);
        $count = 0;

        Attendance::query()
            ->whereNull('check_out_time')
            ->whereNotNull('check_in_time')
            ->where('check_in_time', '<=', $cutoff)
            ->orderBy('id')
            ->chunkById(200, function ($rows) use (&$count, $hours) {
                foreach ($rows as $attendance) {
                    $checkoutAt = (clone $attendance->check_in_time)->addHours($hours);
                    $attendance->check_out_time = $checkoutAt;
                    $attendance->check_out_notes = trim(($attendance->check_out_notes ?: '') . ' Auto checkout after '.$hours.'h');

                    if (method_exists($attendance, 'calculateHours')) {
                        // calculateHours() will save the record
                        $attendance->calculateHours();
                    } else {
                        $attendance->save();
                    }

                    try {
                        event(new \App\Events\AttendanceUpdated($attendance->id, 'Auto check-out after '.$hours.'h', [
                            'supervisor_id' => $attendance->supervisor_id,
                            'guard_id' => $attendance->guard_id,
                            'client_site_id' => $attendance->client_site_id,
                            'time' => $attendance->check_out_time?->toIso8601String(),
                            'status' => 'auto_checked_out',
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
