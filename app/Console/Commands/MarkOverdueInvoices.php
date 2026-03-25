<?php

namespace App\Console\Commands;

use App\Models\Invoice;
use Carbon\Carbon;
use Illuminate\Console\Command;

class MarkOverdueInvoices extends Command
{
    protected $signature = 'invoices:mark-overdue';
    protected $description = 'Mark invoices as overdue when past their due date';

    public function handle(): int
    {
        $count = Invoice::where('status', 'sent')
            ->where('due_date', '<', Carbon::today())
            ->update(['status' => 'overdue']);

        $this->info("Marked {$count} invoices as overdue.");

        return self::SUCCESS;
    }
}
