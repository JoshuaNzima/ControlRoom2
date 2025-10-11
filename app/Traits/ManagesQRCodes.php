<?php

namespace App\Traits;

use App\Models\Zone;
use App\Models\Guards\Checkpoint;

trait ManagesQRCodes
{
    protected function getQRCodeData()
    {
        $zones = Zone::select(['id', 'name', 'description'])
            ->get();

        $checkpoints = Checkpoint::select(['id', 'name', 'code', 'client_site_id'])
            ->with('clientSite:id,name')
            ->get();

        return [
            'qrData' => [
                'zones' => $zones,
                'checkpoints' => $checkpoints,
            ]
        ];
    }
}