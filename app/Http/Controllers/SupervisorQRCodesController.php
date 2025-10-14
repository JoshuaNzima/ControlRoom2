<?php

namespace App\Http\Controllers;

use App\Models\Zone;
use App\Models\Guards\Checkpoint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;
use ZipArchive;
use Intervention\Image\ImageManagerStatic as Image;

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
            $data = json_encode([
                'issuer' => 'CoinSecurity',
                'type' => 'zone',
                'code' => $zone->code,
                'name' => $zone->name,
                'version' => 'v1'
            ]);
            $url = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' . urlencode($data);
            $png = @file_get_contents($url);
            if ($png !== false) {
                $filename = 'zones/ZONE_' . ($zone->code ?: ('Z' . $zone->id)) . '.png';
                $withLogo = $this->overlayLogoOnPng($png);
                $zip->addFromString($filename, $withLogo);
                // Persist for reprint
                Storage::disk('public')->put('qr_codes/' . $filename, $withLogo);
            }
        }

        // Checkpoints QR codes (use model helper when available)
        $checkpoints = Checkpoint::select(['id', 'code', 'name'])->get();
        foreach ($checkpoints as $cp) {
            $data = json_encode([
                'issuer' => 'CoinSecurity',
                'type' => 'checkpoint',
                'code' => $cp->code,
                'name' => $cp->name,
                'version' => 'v1'
            ]);
            $url = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' . urlencode($data);
            $png = @file_get_contents($url);
            if ($png !== false) {
                $filename = 'checkpoints/CHK_' . ($cp->code ?: ('CP' . $cp->id)) . '.png';
                $withLogo = $this->overlayLogoOnPng($png);
                $zip->addFromString($filename, $withLogo);
                // Persist for reprint
                Storage::disk('public')->put('qr_codes/' . $filename, $withLogo);
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

    /**
     * Overlay centered Coin logo onto a QR PNG and return PNG binary.
     */
    private function overlayLogoOnPng(string $pngBinary): string
    {
        try {
            $qr = Image::make($pngBinary);
            $logoPath = public_path('images/Coin-logo.png');
            if (!is_file($logoPath)) {
                return $pngBinary; // fallback if logo missing
            }
            $logo = Image::make($logoPath);
            // Resize logo to ~20% of QR size
            $target = (int) floor(min($qr->width(), $qr->height()) * 0.2);
            $logo->resize($target, $target, function ($constraint) {
                $constraint->aspectRatio();
                $constraint->upsize();
            });

            $qr->insert($logo, 'center');
            return (string) $qr->encode('png');
        } catch (\Throwable $e) {
            return $pngBinary; // on any processing error, return original
        }
    }

    /**
     * Download a zip of previously saved QR codes from storage.
     */
    public function downloadSaved()
    {
        $files = collect(Storage::disk('public')->files('qr_codes/zones'))
            ->merge(Storage::disk('public')->files('qr_codes/checkpoints'))
            ->values();

        if ($files->isEmpty()) {
            abort(404, 'No saved QR codes found');
        }

        $tmpFile = tempnam(sys_get_temp_dir(), 'qrzip_saved_') . '.zip';
        $zip = new ZipArchive();
        if ($zip->open($tmpFile, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            abort(500, 'Unable to create ZIP archive');
        }

        foreach ($files as $path) {
            $contents = Storage::disk('public')->get($path);
            $zip->addFromString(basename($path), $contents);
        }

        $zip->close();

        return new StreamedResponse(function() use ($tmpFile) {
            readfile($tmpFile);
        }, 200, [
            'Content-Type' => 'application/zip',
            'Content-Disposition' => 'attachment; filename="qr_codes_saved_' . now()->format('Ymd_His') . '.zip"',
            'Content-Length' => filesize($tmpFile),
        ]);
    }

    /**
     * Return a simple listing of saved QR code files with public URLs.
     */
    public function listSaved()
    {
        $zones = Storage::disk('public')->files('qr_codes/zones');
        $checkpoints = Storage::disk('public')->files('qr_codes/checkpoints');

        $toListing = function($paths) {
            return collect($paths)->map(function($p) {
                return [
                    'name' => basename($p),
                    'path' => $p,
                    'url' => Storage::disk('public')->url($p),
                ];
            })->values();
        };

        return response()->json([
            'zones' => $toListing($zones),
            'checkpoints' => $toListing($checkpoints),
        ]);
    }
}