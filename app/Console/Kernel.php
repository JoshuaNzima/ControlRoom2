<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    protected function schedule(Schedule $schedule)
    {
        // Run the prepayments migration daily to move any prepaid amounts into recognized revenue for current months
        $schedule->command('prepayments:migrate')->daily();
        $schedule->command('attendance:auto-checkout')->everyFifteenMinutes();
        $schedule->command('zones:recalc-required-guards')->dailyAt('02:30');
        $schedule->command('attendance:auto-mark-absent')->dailyAt('06:30');
        $schedule->command('requisitions:expire-pending')->dailyAt('01:30');
        $schedule->command('backup:run --only-files --disable-notifications')->dailyAt('02:00');
        $schedule->command('backup:clean')->dailyAt('03:00');
        $schedule->command('backup:monitor')->dailyAt('08:00');
    }

    protected function commands()
    {
        $this->load(__DIR__.'/Commands');
    }
}
