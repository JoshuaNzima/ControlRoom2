<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Guards\Shift;
use App\Models\Guards\Attendance;
use Carbon\Carbon;

class AutoMarkAbsentAttendance extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'attendance:auto-mark-absent {date? : Target date in Y-m-d format (defaults to yesterday)}';

    /**
     * The console command description.
     */
    protected $description = 'Automatically create absent attendance records for guards who had shifts but no attendance.';

    public function handle(): int
    {
        $dateInput = $this->argument('date');

        if ($dateInput) {
            try {
                $targetDate = Carbon::parse($dateInput)->startOfDay();
            } catch (\Throwable $e) {
                $this->error('Invalid date format. Use Y-m-d.');
                return self::FAILURE;
            }
        } else {
            // Default to yesterday so we do not interfere with the current day / backdating window
            $targetDate = Carbon::yesterday()->startOfDay();
        }

        $dateString = $targetDate->toDateString();
        $this->info('Running auto-mark absent for date: '.$dateString);

        $createdCount = 0;
        $updatedShifts = 0;

        Shift::query()
            ->whereDate('date', $dateString)
            ->whereNotIn('status', ['cancelled'])
            ->orderBy('id')
            ->chunkById(200, function ($shifts) use ($dateString, &$createdCount, &$updatedShifts) {
                $byGuard = $shifts->groupBy('guard_id');

                foreach ($byGuard as $guardId => $guardShifts) {
                    if (!$guardId) {
                        continue;
                    }

                    // Skip if an attendance record (present/late/leave/absent/etc.) already exists for this guard/date
                    $hasAttendance = Attendance::where('guard_id', $guardId)
                        ->whereDate('date', $dateString)
                        ->exists();

                    if ($hasAttendance) {
                        continue;
                    }

                    /** @var \App\Models\Guards\Shift $firstShift */
                    $firstShift = $guardShifts->sortBy('start_time')->first();

                    $attendance = new Attendance([
                        'guard_id' => $guardId,
                        'supervisor_id' => null,
                        'client_site_id' => $firstShift?->client_site_id,
                        'date' => $dateString,
                        'check_in_time' => null,
                        'check_out_time' => null,
                        'hours_worked' => 0,
                        'overtime_hours' => 0,
                        'status' => 'absent',
                        'check_in_notes' => 'Auto-marked absent based on scheduled shift.',
                        'check_out_notes' => null,
                        'backdated' => false,
                        'backdated_reason' => null,
                        'source' => 'auto_absent_shift',
                    ]);

                    $attendance->save();
                    $createdCount++;

                    // Mark shifts as missed for better reporting
                    foreach ($guardShifts as $shift) {
                        if (in_array($shift->status, ['scheduled', 'in_progress']) && !$shift->actual_start_time) {
                            $shift->status = 'missed';
                            $shift->reason_for_cancellation = trim(($shift->reason_for_cancellation ?: '').' Auto-marked as missed due to no attendance.');
                            $shift->save();
                            $updatedShifts++;
                        }
                    }

                    // Fire event so dashboards/alerts pick up the new absent record
                    try {
                        event(new \App\Events\AttendanceUpdated($attendance->id, 'Auto-marked absent from shift', [
                            'guard_id' => $attendance->guard_id,
                            'client_site_id' => $attendance->client_site_id,
                            'status' => $attendance->status,
                            'date' => $attendance->date?->toDateString(),
                            'source' => $attendance->source,
                        ]));
                    } catch (\Throwable $e) {
                        // no-op for background job
                    }
                }
            });

        $this->info("Created {$createdCount} absent attendance records. Updated {$updatedShifts} shifts to missed.");

        return self::SUCCESS;
    }
}
