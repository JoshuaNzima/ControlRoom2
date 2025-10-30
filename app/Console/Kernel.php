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
    }

    protected function commands()
    {
        $this->load(__DIR__.'/Commands');
    }
}
