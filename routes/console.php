<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Mark overdue invoices daily at midnight
Schedule::command('invoices:mark-overdue')->dailyAt('00:00');
Schedule::command('tasks:mark-overdue')->daily();
Schedule::command('requisitions:expire-pending')->dailyAt('01:00');
// Generate monthly reports on the 1st of each month at 02:00
Schedule::command('requisitions:generate-reports')->monthlyOn(1, '02:00');
// Archive old requisitions on the 1st of each month at 03:00
Schedule::command('requisitions:archive-old')->monthlyOn(1, '03:00');
