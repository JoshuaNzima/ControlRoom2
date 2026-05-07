<?php

namespace App\Http\Controllers;

use App\Models\Zone;
use App\Models\Guards\Checkpoint;
use App\Models\Guards\ClientSite;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;
use ZipArchive;
use Intervention\Image\ImageManagerStatic as Image;

class SupervisorQRCodesController extends Controller
{
    public function index(Request $request)
    {
        $zones = Zone::select(['id', 'name', 'description', 'code'])
            ->with(['sites' => function($q) {
                $q->select(['id', 'zone_id', 'name', 'qr_code', 'status']);
            }, 'sites.checkpoints' => function($q) {
                $q->select(['id', 'client_site_id', 'name', 'code', 'type', 'is_active']);
            }])
            ->get()
            ->map(function($zone) {
                $checkpointCount = $zone->sites->sum(fn($s) => $s->checkpoints->count());
                $sitesWithQr = $zone->sites->map(function($site) {
                    $checkpoints = $site->checkpoints->map(function($cp) {
                        return [
                            'id' => $cp->id,
                            'name' => $cp->name,
                            'code' => $cp->code,
                            'type' => $cp->type,
                            'is_active' => $cp->is_active,
                        ];
                    });
                    return [
                        'id' => $site->id,
                        'name' => $site->name,
                        'qr_code' => $site->qr_code,
                        'status' => $site->status,
                        'checkpoints' => $checkpoints,
                    ];
                });
                return [
                    'id' => $zone->id,
                    'name' => $zone->name,
                    'code' => $zone->code,
                    'description' => $zone->description,
                    'checkpoints_count' => $checkpointCount,
                    'sites' => $sitesWithQr,
                ];
            });

        // Get all checkpoints with site and client info
        $checkpoints = Checkpoint::with(['clientSite.client:id,name', 'clientSite:id,name,client_id,qr_code,status'])
            ->select(['id', 'client_site_id', 'name', 'code', 'type', 'is_active'])
            ->orderBy('name')
            ->get()
            ->map(function($cp) {
                return [
                    'id' => $cp->id,
                    'name' => $cp->name,
                    'code' => $cp->code,
                    'type' => $cp->type,
                    'is_active' => $cp->is_active,
                    'site' => $cp->clientSite ? [
                        'id' => $cp->clientSite->id,
                        'name' => $cp->clientSite->name,
                        'qr_code' => $cp->clientSite->qr_code,
                        'status' => $cp->clientSite->status,
                        'client' => $cp->clientSite->client ? [
                            'id' => $cp->clientSite->client->id,
                            'name' => $cp->clientSite->client->name,
                        ] : null,
                    ] : null,
                ];
            });

        // Determine which page to render based on route name
        $routeName = $request->route()->getName() ?? '';
        if (str_starts_with($routeName, 'control-room.')) {
            return Inertia::render('ControlRoom/SupervisorQRCodes', [
                'zones' => $zones,
                'checkpoints' => $checkpoints,
            ]);
        }

        // Default to Admin page (admin route passes the same props)
        return Inertia::render('Admin/QRCodes', [
            'zones' => $zones,
            'checkpoints' => $checkpoints,
        ]);
    }

    public function downloadBulk()
    {
        $tmpFile = tempnam(sys_get_temp_dir(), 'qrzip_') . '.zip';
        $zip = new ZipArchive();
        if ($zip->open($tmpFile, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            abort(500, 'Unable to create ZIP archive');
        }

        // Client Sites QR codes (embed JSON payload using unique qr_code)
        $sites = ClientSite::with(['client:id,name'])->get(['id','name','client_id','qr_code']);
        foreach ($sites as $site) {
            // Ensure site has a QR code (backfill if needed during transition)
            if (!$site->qr_code) {
                $site->qr_code = ClientSite::generateUniqueQrCode();
                \DB::table('client_sites')->where('id', $site->id)->update(['qr_code' => $site->qr_code]);
            }
            $payload = $site->getQrPayload();
            $url = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' . urlencode(json_encode($payload));
            $png = @file_get_contents($url);
            if ($png !== false) {
                $safeName = $site->qr_code . '_' . Str::slug($site->name ?: ('site-'.$site->id));
                $filename = 'sites/' . $safeName . '.png';
                $withLogo = $this->overlayLogoOnPng($png);
                $zip->addFromString($filename, $withLogo);
                Storage::disk('public')->put('qr_codes/' . $filename, $withLogo);
            }
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
     * Improved with better logo sizing and white background behind logo.
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
            // Resize logo to ~25% of QR size for better visibility
            $target = (int) floor(min($qr->width(), $qr->height()) * 0.25);
            $logo->resize($target, $target, function ($constraint) {
                $constraint->aspectRatio();
                $constraint->upsize();
            });

            // Create a white background canvas for logo to ensure visibility
            $bgSize = $target + 10;
            $bg = Image::canvas($bgSize, $bgSize, '#FFFFFF');
            $bg->insert($logo, 'center');

            // Insert logo with white background at center of QR
            $qr->insert($bg, 'center');
            return (string) $qr->encode('png');
        } catch (\Throwable $e) {
            report($e);
            return $pngBinary; // on any processing error, return original
        }
    }

    /**
     * Generate a printable QR code image with logo, client name, and site name.
     * Creates a larger format suitable for printing (600x800 with labels).
     */
    private function createPrintableQrPng(string $qrBinary, string $clientName, string $siteName, string $qrCode): string
    {
        try {
            // Start with QR code at larger size (600x600)
            $qr = Image::make($qrBinary)->resize(600, 600);

            // Apply logo overlay to QR
            $qrWithLogo = Image::make($this->overlayLogoOnPng((string) $qr->encode('png')));

            // Create canvas for printable QR (600x800 - extra space for labels)
            $canvas = Image::canvas(600, 800, '#FFFFFF');

            // Add QR code at top
            $canvas->insert($qrWithLogo, 'top', 0, 20);

            // Add text labels
            $canvas->text('COIN SECURITY', 300, 640, function($font) {
                $font->file(public_path('fonts/arialbd.ttf'));
                $font->size(28);
                $font->color('#1a1a1a');
                $font->align('center');
            });

            $canvas->text('Client: ' . $clientName, 300, 680, function($font) {
                $font->size(20);
                $font->color('#333333');
                $font->align('center');
            });

            $canvas->text('Site: ' . $siteName, 300, 710, function($font) {
                $font->size(18);
                $font->color('#555555');
                $font->align('center');
            });

            $canvas->text('Code: ' . $qrCode, 300, 740, function($font) {
                $font->size(16);
                $font->color('#777777');
                $font->align('center');
            });

            return (string) $canvas->encode('png', 100);
        } catch (\Throwable $e) {
            report($e);
            // Return original QR with logo if printable creation fails
            return $this->overlayLogoOnPng($qrBinary);
        }
    }

    /**
     * Generate printable QR codes (A4/Letter size, multiple per page).
     * Returns a ZIP with individual printable QR codes.
     */
    public function downloadPrintable()
    {
        $tmpFile = tempnam(sys_get_temp_dir(), 'qrprint_') . '.zip';
        $zip = new ZipArchive();
        if ($zip->open($tmpFile, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            abort(500, 'Unable to create ZIP archive');
        }

        // Client Sites printable QR codes
        $sites = ClientSite::with(['client:id,name'])->get(['id','name','client_id','qr_code']);
        foreach ($sites as $site) {
            if (!$site->qr_code) {
                $site->qr_code = ClientSite::generateUniqueQrCode();
                \DB::table('client_sites')->where('id', $site->id)->update(['qr_code' => $site->qr_code]);
            }
            $payload = $site->getQrPayload();
            // Generate larger QR for print (600x600)
            $url = 'https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=' . urlencode(json_encode($payload));
            $png = @file_get_contents($url);
            if ($png !== false) {
                $clientName = $site->client?->name ?? 'Unknown Client';
                $printablePng = $this->createPrintableQrPng($png, $clientName, $site->name, $site->qr_code);
                $safeName = $site->qr_code . '_' . Str::slug($site->name ?: ('site-'.$site->id));
                $filename = 'printable/' . $safeName . '_print.png';
                $zip->addFromString($filename, $printablePng);
                Storage::disk('public')->put('qr_codes/' . $filename, $printablePng);
            }
        }

        // Checkpoints printable QR codes
        $checkpoints = Checkpoint::with(['site.client:id,name'])->get(['id','code','name','client_site_id']);
        foreach ($checkpoints as $cp) {
            $data = json_encode([
                'issuer' => 'CoinSecurity',
                'type' => 'checkpoint',
                'code' => $cp->code,
                'name' => $cp->name,
                'version' => 'v1'
            ]);
            $url = 'https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=' . urlencode($data);
            $png = @file_get_contents($url);
            if ($png !== false) {
                $clientName = $cp->site?->client?->name ?? 'Unknown Client';
                $siteName = $cp->site?->name ?? 'Unknown Site';
                $printablePng = $this->createPrintableQrPng($png, $clientName, $cp->name . ' (' . $siteName . ')', $cp->code);
                $filename = 'printable/CHK_' . ($cp->code ?: ('CP' . $cp->id)) . '_print.png';
                $zip->addFromString($filename, $printablePng);
                Storage::disk('public')->put('qr_codes/' . $filename, $printablePng);
            }
        }

        // Zones printable QR codes
        $zones = Zone::select(['id', 'code', 'name'])->get();
        foreach ($zones as $zone) {
            $data = json_encode([
                'issuer' => 'CoinSecurity',
                'type' => 'zone',
                'code' => $zone->code,
                'name' => $zone->name,
                'version' => 'v1'
            ]);
            $url = 'https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=' . urlencode($data);
            $png = @file_get_contents($url);
            if ($png !== false) {
                $printablePng = $this->createPrintableQrPng($png, 'COIN SECURITY', 'Zone: ' . $zone->name, $zone->code);
                $filename = 'printable/ZONE_' . ($zone->code ?: ('Z' . $zone->id)) . '_print.png';
                $zip->addFromString($filename, $printablePng);
                Storage::disk('public')->put('qr_codes/' . $filename, $printablePng);
            }
        }

        $zip->close();

        return new StreamedResponse(function() use ($tmpFile) {
            readfile($tmpFile);
        }, 200, [
            'Content-Type' => 'application/zip',
            'Content-Disposition' => 'attachment; filename="qr_codes_printable_' . now()->format('Ymd_His') . '.zip"',
            'Content-Length' => filesize($tmpFile),
        ]);
    }

    /**
     * Download a zip of previously saved QR codes from storage.
     */
    public function downloadSaved()
    {
        $files = collect(Storage::disk('public')->files('qr_codes/zones'))
            ->merge(Storage::disk('public')->files('qr_codes/checkpoints'))
            ->merge(Storage::disk('public')->files('qr_codes/sites'))
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
        $sites = Storage::disk('public')->files('qr_codes/sites');

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
            'success' => true,
            'zones' => $toListing($zones),
            'checkpoints' => $toListing($checkpoints),
            'sites' => $toListing($sites),
        ]);
    }
}