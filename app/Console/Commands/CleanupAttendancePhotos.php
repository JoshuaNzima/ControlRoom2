<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use App\Models\Guards\Attendance;
use Carbon\Carbon;

class CleanupAttendancePhotos extends Command
{
    protected $signature = 'attendance:cleanup-photos {--days=30 : Delete photos older than N days}';
    protected $description = 'Delete old attendance photos while keeping attendance records.';

    public function handle(): int
    {
        $days = (int)$this->option('days');
        $cutoff = Carbon::now()->subDays($days);

        $this->info("Cleaning attendance photos older than {$days} days...");

        $count = 0;

        Attendance::where(function($q) use ($cutoff) {
                $q->whereNotNull('check_in_photo')
                  ->orWhereNotNull('check_out_photo');
            })
            ->where('date', '<', $cutoff->toDateString())
            ->chunkById(500, function($records) use (&$count) {
                foreach ($records as $attendance) {
                    if ($attendance->check_in_photo && Storage::disk('public')->exists($attendance->check_in_photo)) {
                        Storage::disk('public')->delete($attendance->check_in_photo);
                    }
                    if ($attendance->check_out_photo && Storage::disk('public')->exists($attendance->check_out_photo)) {
                        Storage::disk('public')->delete($attendance->check_out_photo);
                    }
                    // Keep the record, null out the paths
                    $attendance->check_in_photo = null;
                    $attendance->check_out_photo = null;
                    $attendance->save();
                    $count++;
                }
            });

        $this->info("Done. Cleaned {$count} attendance photo references.");
        return Command::SUCCESS;
    }
}


