<?php

namespace App\Traits;

use App\Models\Zone;
use App\Models\Checkpoint;
use App\Models\Asset;

trait ManagesQRCodes
{
    protected function getQRCodeData()
    {
        $zones = Zone::select(['id', 'name', 'description'])
            ->withCount(['checkpoints'])
            ->get();

        $checkpoints = Checkpoint::select(['id', 'name', 'location', 'zone_id'])
            ->with('zone:id,name')
            ->get();

        $assets = Asset::select(['id', 'name', 'type', 'location'])
            ->get();

        return [
            'qrData' => [
                'zones' => $zones,
                'checkpoints' => $checkpoints,
                'assets' => $assets,
            ]
        ];
    }
}