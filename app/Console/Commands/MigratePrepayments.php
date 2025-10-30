<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class MigratePrepayments extends Command
{
    protected $signature = 'prepayments:migrate';

    protected $description = 'Move prepaid_amount into amount_paid for payments that are now due (recognize revenue)';

    public function handle()
    {
        $now = now();
        $currentYear = $now->year;
        $currentMonth = $now->month;

        DB::transaction(function () use ($currentYear, $currentMonth) {
            $rows = DB::table('client_payments')
                ->where('prepaid_amount', '>', 0)
                ->where(function ($q) use ($currentYear, $currentMonth) {
                    $q->where('year', '<', $currentYear)
                      ->orWhere(function ($q2) use ($currentYear, $currentMonth) {
                          $q2->where('year', $currentYear)
                             ->where('month', '<=', $currentMonth);
                      });
                })
                ->get();

            foreach ($rows as $r) {
                $newPaid = (float) $r->amount_paid + (float) $r->prepaid_amount;
                DB::table('client_payments')
                    ->where('id', $r->id)
                    ->update(['amount_paid' => $newPaid, 'prepaid_amount' => 0]);
            }
        });

        $this->info('Prepayments migrated to recognized revenue.');
        return 0;
    }
}
