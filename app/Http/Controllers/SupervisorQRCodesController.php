<?php

namespace App\Http\Controllers;

use App\Models\Zone;
use App\Models\Guards\Checkpoint;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;
use ZipArchive;

class SupervisorQRCodesController extends Controller
{
    public function index()
    {
        $zones = Zone::select(['id', 'name', 'description', 'code'])
            ->with(['sites' => function($q) {
                $q->select(['id', 'zone_id']);
            }, 'sites.checkpoints' => function($q) {
                $q->select(['id', 'client_site_id']);
            }])
            ->get()
            ->map(function($zone) {
                $checkpointCount = $zone->sites->sum(fn($s) => $s->checkpoints->count());
                return [
                    'id' => $zone->id,
                    'name' => $zone->name,
                    'code' => $zone->code,
                    'description' => $zone->description,
                    'checkpoints_count' => $checkpointCount,
                ];
            });

        // Reuse this for Admin page as well (admin route passes the same props)
        return Inertia::render('Admin/QRCodes', [
            'zones' => $zones
        ]);
    }

    public function downloadBulk()
    {
        $tmpFile = tempnam(sys_get_temp_dir(), 'qrzip_') . '.zip';
        $zip = new ZipArchive();
        if ($zip->open($tmpFile, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            abort(500, 'Unable to create ZIP archive');
        }

        // Zones QR codes (encode the zone code)
        $zones = Zone::select(['id', 'code', 'name'])->get();
        foreach ($zones as $zone) {
            $data = json_encode(['type' => 'zone', 'code' => $zone->code, 'name' => $zone->name]);
            $url = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' . urlencode($data);
            $png = @file_get_contents($url);
            if ($png !== false) {
                $filename = 'zones/ZONE_' . ($zone->code ?: ('Z' . $zone->id)) . '.png';
                $zip->addFromString($filename, $png);
            }
        }

        // Checkpoints QR codes (use model helper when available)
        $checkpoints = Checkpoint::select(['id', 'code', 'name'])->get();
        foreach ($checkpoints as $cp) {
            $data = json_encode(['type' => 'checkpoint', 'code' => $cp->code, 'name' => $cp->name]);
            $url = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' . urlencode($data);
            $png = @file_get_contents($url);
            if ($png !== false) {
                $filename = 'checkpoints/CHK_' . ($cp->code ?: ('CP' . $cp->id)) . '.png';
                $zip->addFromString($filename, $png);
            }
        }

        $zip->close();

        return new StreamedResponse(function() use ($tmpFile) {
            readfile($tmpFile);
        }, 200, [
            'Content-Type' => 'application/zip',
            'Content-Disposition' => 'attachment; filename="qr_codes_' . now()->format('Ymd_His') . '.zip"',
            'Content-Length' => filesize($tmpFile),
        ]);
    }
}