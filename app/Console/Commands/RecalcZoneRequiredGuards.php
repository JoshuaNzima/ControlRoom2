<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Zone;
use App\Models\Guards\ClientSite;

class RecalcZoneRequiredGuards extends Command
{
    protected $signature = 'zones:recalc-required-guards {zone_id?}';

    protected $description = 'Recalculate Zone.required_guard_count from active client sites';

    public function handle(): int
    {
        $zoneId = $this->argument('zone_id');

        if ($zoneId) {
            $zone = Zone::find($zoneId);
            if (!$zone) {
                $this->error('Zone not found');
                return self::FAILURE;
            }
            $sum = ClientSite::query()
                ->where('zone_id', $zone->id)
                ->where('status', 'active')
                ->sum('required_guards');
            $zone->update(['required_guard_count' => (int) $sum]);
            $this->info("Zone {$zone->id} updated to {$sum}");
            return self::SUCCESS;
        }

        Zone::query()->orderBy('id')->chunkById(100, function ($zones) {
            foreach ($zones as $zone) {
                $sum = ClientSite::query()
                    ->where('zone_id', $zone->id)
                    ->where('status', 'active')
                    ->sum('required_guards');
                $zone->update(['required_guard_count' => (int) $sum]);
                $this->line("Zone {$zone->id} => {$sum}");
            }
        });

        $this->info('Recalculation complete');
        return self::SUCCESS;
    }
}
