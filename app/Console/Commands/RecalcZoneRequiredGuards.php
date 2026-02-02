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
            ClientSite::recalcZoneRequiredGuards($zone->id);
            $zone->refresh();
            $this->info("Zone {$zone->id} updated to {$zone->required_guard_count}");
            return self::SUCCESS;
        }

        Zone::query()->orderBy('id')->chunkById(100, function ($zones) {
            foreach ($zones as $zone) {
                ClientSite::recalcZoneRequiredGuards($zone->id);
                $zone->refresh();
                $this->line("Zone {$zone->id} => {$zone->required_guard_count}");
            }
        });

        $this->info('Recalculation complete');
        return self::SUCCESS;
    }
}
