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
