<?php

namespace App\Http\Controllers\ZoneCommander;

use App\Http\Controllers\Controller;
use App\Models\Guards\Checkpoint;
use App\Models\Guards\ClientSite;
use App\Models\Guards\Guard;
use App\Models\Zone;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;
use ZipArchive;
use Intervention\Image\ImageManagerStatic as Image;

class CheckpointController extends Controller
{
    /**
     * List checkpoints for the zone commander's zone
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        if (!$user->zone_id) {
            return redirect()->route('dashboard')->with('error', 'No zone assigned to your account. Please contact an administrator.');
        }

        $query = Checkpoint::with(['clientSite.client:id,name', 'clientSite:id,name,client_id,qr_code,status'])
            ->whereHas('clientSite', function ($q) use ($user) {
                $q->where('zone_id', $user->zone_id);
            })
            ->select(['id', 'client_site_id', 'name', 'code', 'type', 'description', 'is_active', 'requires_photo', 'scan_radius_meters', 'latitude', 'longitude']);

        if ($request->filled('site_id')) {
            $query->where('client_site_id', $request->site_id);
        }

        if ($request->filled('status')) {
            $query->where('is_active', $request->status === 'active');
        }

        $checkpoints = $query->orderBy('name')
            ->paginate(20)
            ->through(function ($cp) {
                return [
                    'id' => $cp->id,
                    'name' => $cp->name,
                    'code' => $cp->code,
                    'type' => $cp->type,
                    'description' => $cp->description,
                    'is_active' => $cp->is_active,
                    'requires_photo' => $cp->requires_photo,
                    'scan_radius_meters' => $cp->scan_radius_meters,
                    'latitude' => $cp->latitude,
                    'longitude' => $cp->longitude,
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

        // Get sites for the zone (for filtering)
        $sites = ClientSite::with('client:id,name')
            ->where('zone_id', $user->zone_id)
            ->select(['id', 'name', 'client_id', 'status'])
            ->where('status', 'active')
            ->orderBy('name')
            ->get()
            ->map(function ($site) {
                return [
                    'id' => $site->id,
                    'name' => $site->name,
                    'client_name' => $site->client?->name,
                ];
            });

        return Inertia::render('ZoneCommander/Checkpoints', [
            'checkpoints' => $checkpoints,
            'sites' => $sites,
            'filters' => $request->only(['site_id', 'status']),
        ]);
    }

    /**
     * Generate QR code image for a checkpoint
     */
    public function qr(Checkpoint $checkpoint)
    {
        $user = Auth::user();
        if (!$user->zone_id) {
            abort(403, 'No zone assigned.');
        }

        // Verify checkpoint belongs to user's zone
        if ($checkpoint->clientSite?->zone_id !== $user->zone_id) {
            abort(403, 'Checkpoint not in your zone.');
        }

        $data = json_encode([
            'issuer' => 'CoinSecurity',
            'type' => 'checkpoint',
            'code' => $checkpoint->code,
            'name' => $checkpoint->name,
            'site_id' => $checkpoint->client_site_id,
            'ver' => 'v2'
        ]);

        $url = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' . urlencode($data);
        $png = @file_get_contents($url);

        if ($png === false) {
            abort(500, 'Failed to generate QR code');
        }

        // Overlay logo
        $withLogo = $this->overlayLogoOnPng($png);

        return response($withLogo)
            ->header('Content-Type', 'image/png')
            ->header('Content-Disposition', 'inline; filename="checkpoint_' . $checkpoint->code . '.png"');
    }

    /**
     * Printable QR page for a checkpoint - returns HTML matching main QR design
     */
    public function qrPrint(Request $request, Checkpoint $checkpoint)
    {
        $user = Auth::user();
        if (!$user->zone_id) {
            abort(403, 'No zone assigned.');
        }

        // Verify checkpoint belongs to user's zone
        if ($checkpoint->clientSite?->zone_id !== $user->zone_id) {
            abort(403, 'Checkpoint not in your zone.');
        }

        $layout = $request->get('layout', 'portrait');
        $checkpoint->load(['clientSite.client']);

        $payload = [
            'issuer' => 'CoinSecurity',
            'type' => 'checkpoint',
            'code' => $checkpoint->code,
            'name' => $checkpoint->name,
            'site_id' => $checkpoint->client_site_id,
            'ver' => 'v2',
        ];

        $qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=' . urlencode(json_encode($payload));
        $logoUrl = asset('images/Coin-logo.png');
        $emergencyHotline = config('app.emergency_hotline', '+265 999 611 711');
        $siteName = $checkpoint->clientSite?->name ?? 'Unknown Site';
        $clientName = $checkpoint->clientSite?->client?->name ?? 'Unknown Client';
        $alternateLayoutUrl = $layout === 'portrait'
            ? $request->fullUrlWithQuery(['layout' => 'landscape'])
            : $request->fullUrlWithQuery(['layout' => 'portrait']);
        $alternateLayoutLabel = $layout === 'portrait' ? 'Switch to Landscape' : 'Switch to Portrait';

        // Get leader info for contact details
        $leaderInfo = $this->getSiteLeaderInfo($checkpoint->clientSite);

        if ($layout === 'landscape') {
            $html = $this->getLandscapeLayout($checkpoint, $qrUrl, $logoUrl, $emergencyHotline, $siteName, $clientName, $alternateLayoutUrl, $alternateLayoutLabel, $leaderInfo);
        } else {
            $html = $this->getPortraitLayout($checkpoint, $qrUrl, $logoUrl, $emergencyHotline, $siteName, $clientName, $alternateLayoutUrl, $alternateLayoutLabel, $leaderInfo);
        }

        return response($html, 200, ['Content-Type' => 'text/html']);
    }

    /**
     * Get supervisor/sergeant assigned to site, or zone commander as fallback
     */
    private function getSiteLeaderInfo(?ClientSite $site): array
    {
        if (!$site) {
            return ['type' => 'Zone Commander', 'name' => 'Not Assigned', 'phone' => null, 'has_leader' => false];
        }

        // Try to find an active supervisor or sergeant assigned to this site
        $supervisor = Guard::query()
            ->whereIn('position', ['supervisor', 'sergeant'])
            ->where('status', 'active')
            ->whereHas('assignments', function ($q) use ($site) {
                $q->where('client_site_id', $site->id)
                    ->where('is_active', true)
                    ->where('start_date', '<=', today())
                    ->where(function ($sq) {
                        $sq->whereNull('end_date')->orWhere('end_date', '>=', today());
                    });
            })
            ->first();

        if ($supervisor) {
            return [
                'type' => $supervisor->position === 'sergeant' ? 'Sergeant' : 'Supervisor',
                'name' => $supervisor->name,
                'phone' => $supervisor->phone ?? null,
                'has_leader' => true,
            ];
        }

        // Fallback to zone commander
        $zone = $site->zone_id ? Zone::query()->with(['commander:id,name,phone,zone_id'])->find($site->zone_id) : null;
        $commander = $zone?->commander;
        if ($commander) {
            return [
                'type' => 'Zone Commander',
                'name' => $commander->name,
                'phone' => $commander->phone ?? null,
                'has_leader' => true,
            ];
        }

        return [
            'type' => 'Zone Commander',
            'name' => 'Not Assigned',
            'phone' => null,
            'has_leader' => false,
        ];
    }

    private function getPortraitLayout($checkpoint, $qrUrl, $logoUrl, $emergencyHotline, $siteName, $clientName, $alternateLayoutUrl, $alternateLayoutLabel, array $leaderInfo)
    {
        $leaderType = $leaderInfo['type'];
        $leaderName = $leaderInfo['name'];
        $leaderPhone = $leaderInfo['phone'] ?? '';
        $leaderPhoneHtml = $leaderPhone ? "<div class='leader-phone'>{$leaderPhone}</div>" : '';

        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{$checkpoint->name} - Checkpoint QR</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: Arial, sans-serif;
            background: #f5f5f5;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }
        .print-container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            padding: 40px;
            text-align: center;
            max-width: 500px;
            width: 100%;
        }
        .logo {
            width: 180px;
            height: auto;
            margin-bottom: 30px;
        }
        .qr-wrapper {
            position: relative;
            display: inline-block;
            margin: 20px 0;
        }
        .qr-code {
            width: 350px;
            height: 350px;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .qr-overlay {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 80px;
            height: 80px;
            background: white;
            border-radius: 50%;
            padding: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        .qr-overlay img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            border-radius: 50%;
        }
        .checkpoint-name {
            font-size: 28px;
            font-weight: bold;
            color: #1a1a1a;
            margin: 25px 0 10px;
        }
        .site-info {
            font-size: 18px;
            color: #666;
            margin-bottom: 15px;
        }
        .divider {
            width: 60%;
            height: 2px;
            background: linear-gradient(to right, transparent, #c41e3a, transparent);
            margin: 25px auto;
        }
        .emergency {
            background: #c41e3a;
            color: white;
            padding: 25px;
            border-radius: 12px;
            margin-top: 20px;
            border: 4px solid #8b1428;
        }
        .emergency-label {
            font-size: 16px;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 10px;
            opacity: 0.95;
            font-weight: bold;
        }
        .emergency-number {
            font-size: 38px;
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }
        .leader-banner {
            background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%);
            color: white;
            padding: 20px;
            border-radius: 12px;
            margin-top: 20px;
            border: 3px solid #c41e3a;
            text-align: center;
        }
        .leader-type {
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 2px;
            opacity: 0.9;
            margin-bottom: 8px;
            color: #c41e3a;
            font-weight: bold;
        }
        .leader-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 6px;
        }
        .leader-phone {
            font-size: 18px;
            opacity: 0.9;
            font-family: monospace;
        }
        .instructions {
            margin-top: 20px;
            padding: 15px;
            background: #f9f9f9;
            border-radius: 8px;
            font-size: 14px;
            color: #555;
            line-height: 1.5;
        }
        .qr-id {
            font-family: monospace;
            font-size: 12px;
            color: #999;
            margin-top: 15px;
            word-break: break-all;
        }
        @media print {
            body { background: white; }
            .print-container { box-shadow: none; }
            .no-print { display: none; }
        }
        .print-btn {
            background: #c41e3a;
            color: white;
            border: none;
            padding: 12px 30px;
            font-size: 16px;
            border-radius: 8px;
            cursor: pointer;
            margin-top: 20px;
            transition: background 0.2s;
        }
        .print-btn:hover { background: #a01830; }
        .layout-toggle {
            background: #666;
            color: white;
            border: none;
            padding: 10px 20px;
            font-size: 14px;
            border-radius: 8px;
            cursor: pointer;
            margin-top: 10px;
            margin-right: 10px;
            transition: background 0.2s;
        }
        .layout-toggle:hover { background: #555; }
    </style>
</head>
<body>
    <div class="print-container">
        <img src="{$logoUrl}" alt="Coin Security Logo" class="logo">

        <div class="qr-wrapper">
            <img src="{$qrUrl}" alt="QR Code" class="qr-code">
            <div class="qr-overlay">
                <img src="{$logoUrl}" alt="Coin">
            </div>
        </div>

        <h1 class="checkpoint-name">{$checkpoint->name}</h1>
        <div class="site-info">{$siteName} - {$clientName}</div>

        <div class="divider"></div>

        <div class="emergency">
            <div class="emergency-label">Emergency Hotline</div>
            <div class="emergency-number">{$emergencyHotline}</div>
        </div>

        <div class="leader-banner">
            <div class="leader-type">{$leaderType}</div>
            <div class="leader-name">{$leaderName}</div>
            {$leaderPhoneHtml}
        </div>

        <div class="instructions">
            <strong>Scan for Patrol Checkpoint</strong><br>
            Scan this QR code during patrol to record checkpoint visit.
        </div>

        <div class="qr-id">Checkpoint Code: {$checkpoint->code}</div>

        <div class="no-print">
            <button class="layout-toggle" onclick="window.location.href='{$alternateLayoutUrl}'">{$alternateLayoutLabel}</button>
            <button class="print-btn" onclick="window.print()">Print QR Code</button>
        </div>
    </div>
</body>
</html>
HTML;
    }

    private function getLandscapeLayout($checkpoint, $qrUrl, $logoUrl, $emergencyHotline, $siteName, $clientName, $alternateLayoutUrl, $alternateLayoutLabel, array $leaderInfo)
    {
        $leaderType = $leaderInfo['type'];
        $leaderName = $leaderInfo['name'];
        $leaderPhone = $leaderInfo['phone'] ?? '';
        $leaderPhoneHtml = $leaderPhone ? "<div class='leader-phone'>{$leaderPhone}</div>" : '';

        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{$checkpoint->name} - Checkpoint QR</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: Arial, sans-serif;
            background: #f5f5f5;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }
        .print-container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            padding: 40px;
            text-align: center;
            max-width: 900px;
            width: 100%;
        }
        .landscape-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #c41e3a;
        }
        .logo {
            width: 180px;
            height: auto;
        }
        .emergency-banner {
            background: #c41e3a;
            color: white;
            padding: 25px 35px;
            border-radius: 12px;
            border: 4px solid #8b1428;
            text-align: center;
        }
        .emergency-label {
            font-size: 16px;
            text-transform: uppercase;
            letter-spacing: 2px;
            font-weight: bold;
            margin-bottom: 8px;
        }
        .emergency-number {
            font-size: 52px;
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .landscape-content {
            display: flex;
            gap: 50px;
            align-items: flex-start;
            justify-content: center;
            flex-wrap: wrap;
        }
        .qr-section {
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .qr-wrapper {
            position: relative;
            display: inline-block;
            margin: 10px 0;
        }
        .qr-code {
            width: 240px;
            height: 240px;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .qr-overlay {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 60px;
            height: 60px;
            background: white;
            border-radius: 50%;
            padding: 6px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        .qr-overlay img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            border-radius: 50%;
        }
        .checkpoint-info {
            flex: 1;
            min-width: 320px;
            text-align: left;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        .checkpoint-name {
            font-size: 42px;
            font-weight: bold;
            color: #1a1a1a;
            margin-bottom: 12px;
            line-height: 1.2;
        }
        .site-name {
            font-size: 26px;
            color: #666;
            margin-bottom: 30px;
        }
        .instructions {
            padding: 25px;
            background: #f9f9f9;
            border-radius: 8px;
            font-size: 18px;
            color: #555;
            line-height: 1.6;
            margin-bottom: 25px;
        }
        .instructions strong {
            display: block;
            font-size: 20px;
            color: #1a1a1a;
            margin-bottom: 8px;
        }
        .qr-id {
            font-family: monospace;
            font-size: 16px;
            color: #666;
            word-break: break-all;
            padding: 12px;
            background: #f5f5f5;
            border-radius: 6px;
        }
        .leader-banner {
            margin-top: 30px;
            padding: 25px;
            background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%);
            color: white;
            border-radius: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 15px;
            border: 3px solid #c41e3a;
        }
        .leader-section {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
        }
        .leader-type {
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: #c41e3a;
            font-weight: bold;
            margin-bottom: 6px;
        }
        .leader-name {
            font-size: 28px;
            font-weight: bold;
        }
        .leader-phone {
            font-size: 20px;
            opacity: 0.9;
            font-family: monospace;
        }
        @media print {
            body { background: white; }
            .print-container { box-shadow: none; }
            .no-print { display: none; }
        }
        .print-btn {
            background: #c41e3a;
            color: white;
            border: none;
            padding: 14px 35px;
            font-size: 18px;
            border-radius: 8px;
            cursor: pointer;
            margin-top: 25px;
            transition: background 0.2s;
        }
        .print-btn:hover { background: #a01830; }
        .layout-toggle {
            background: #666;
            color: white;
            border: none;
            padding: 12px 25px;
            font-size: 15px;
            border-radius: 8px;
            cursor: pointer;
            margin-top: 25px;
            margin-right: 10px;
            transition: background 0.2s;
        }
        .layout-toggle:hover { background: #555; }
    </style>
</head>
<body>
    <div class="print-container">
        <div class="landscape-header">
            <img src="{$logoUrl}" alt="Coin Security Logo" class="logo">
            <div class="emergency-banner">
                <div class="emergency-label">Emergency Hotline</div>
                <div class="emergency-number">{$emergencyHotline}</div>
            </div>
        </div>

        <div class="landscape-content">
            <div class="qr-section">
                <div class="qr-wrapper">
                    <img src="{$qrUrl}" alt="QR Code" class="qr-code">
                    <div class="qr-overlay">
                        <img src="{$logoUrl}" alt="Coin">
                    </div>
                </div>
            </div>

            <div class="checkpoint-info">
                <h1 class="checkpoint-name">{$checkpoint->name}</h1>
                <p class="site-name">{$siteName} - {$clientName}</p>

                <div class="instructions">
                    <strong>Scan for Patrol Checkpoint</strong>
                    Scan this QR code during patrol to record checkpoint visit.
                </div>

                <div class="qr-id">Checkpoint Code: {$checkpoint->code}</div>
            </div>
        </div>

        <div class="leader-banner">
            <div class="leader-section">
                <div class="leader-type">{$leaderType}</div>
                <div class="leader-name">{$leaderName}</div>
            </div>
            {$leaderPhoneHtml}
        </div>

        <div class="no-print">
            <button class="layout-toggle" onclick="window.location.href='{$alternateLayoutUrl}'">{$alternateLayoutLabel}</button>
            <button class="print-btn" onclick="window.print()">Print QR Code</button>
        </div>
    </div>
</body>
</html>
HTML;
    }

    /**
     * Bulk print multiple checkpoint QR codes as a single HTML page
     */
    public function bulkPrint(Request $request)
    {
        $user = Auth::user();
        if (!$user->zone_id) {
            abort(403, 'No zone assigned.');
        }

        $ids = $request->get('ids', []);
        $layout = $request->get('layout', 'portrait');

        $checkpoints = Checkpoint::with(['clientSite.client'])
            ->whereIn('id', $ids)
            ->where('type', 'qr')
            ->whereHas('clientSite', function ($q) use ($user) {
                $q->where('zone_id', $user->zone_id);
            })
            ->orderBy('name')
            ->get();

        if ($checkpoints->isEmpty()) {
            return response('<html><body><h2>No checkpoints selected</h2></body></html>', 200, ['Content-Type' => 'text/html']);
        }

        $logoUrl = asset('images/Coin-logo.png');
        $emergencyHotline = config('app.emergency_hotline', '+265 999 611 711');

        $checkpointCards = $checkpoints->map(function ($cp) use ($layout, $logoUrl, $emergencyHotline) {
            $payload = [
                'issuer' => 'CoinSecurity',
                'type' => 'checkpoint',
                'code' => $cp->code,
                'name' => $cp->name,
                'site_id' => $cp->client_site_id,
                'ver' => 'v2',
            ];
            $qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' . urlencode(json_encode($payload));
            $siteName = $cp->clientSite?->name ?? 'Unknown Site';
            $clientName = $cp->clientSite?->client?->name ?? 'Unknown Client';
            $leaderInfo = $this->getSiteLeaderInfo($cp->clientSite);

            return $this->getCardHtml($cp, $qrUrl, $logoUrl, $emergencyHotline, $siteName, $clientName, $leaderInfo, $layout);
        })->join("\n");

        $html = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Checkpoint QR Codes - Bulk Print</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: Arial, sans-serif;
            background: #f5f5f5;
            padding: 20px;
        }
        .cards-container {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            justify-content: center;
        }
        .card {
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 25px;
            text-align: center;
            page-break-inside: avoid;
            margin-bottom: 15px;
        }
        .card.portrait { width: 380px; }
        .card.landscape { width: 100%; max-width: 850px; }
        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #c41e3a;
        }
        .card.landscape .card-content {
            display: flex;
            gap: 30px;
            align-items: flex-start;
        }
        .card.landscape .qr-section { flex-shrink: 0; }
        .card.landscape .info-section { flex: 1; text-align: left; }
        .logo { width: 100px; height: auto; }
        .qr-wrapper { position: relative; display: inline-block; margin: 10px 0; }
        .qr-code { width: 250px; height: 250px; border-radius: 8px; }
        .card.landscape .qr-code { width: 200px; height: 200px; }
        .qr-overlay {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 60px;
            height: 60px;
            background: white;
            border-radius: 50%;
            padding: 5px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        }
        .qr-overlay img { width: 100%; height: 100%; object-fit: contain; border-radius: 50%; }
        .checkpoint-name { font-size: 22px; font-weight: bold; color: #1a1a1a; margin: 10px 0 5px; }
        .card.landscape .checkpoint-name { font-size: 28px; margin-bottom: 8px; }
        .site-info { font-size: 14px; color: #666; margin-bottom: 10px; }
        .card.landscape .site-info { font-size: 18px; }
        .emergency-badge {
            background: #c41e3a;
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: bold;
        }
        .leader-box {
            background: #1a1a1a;
            color: white;
            padding: 12px;
            border-radius: 8px;
            margin-top: 12px;
            border: 2px solid #c41e3a;
        }
        .leader-type { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #c41e3a; margin-bottom: 4px; }
        .leader-name { font-size: 16px; font-weight: bold; }
        .leader-phone { font-size: 14px; opacity: 0.9; font-family: monospace; margin-top: 4px; }
        .qr-id { font-family: monospace; font-size: 11px; color: #999; margin-top: 10px; }
        .instructions { font-size: 12px; color: #555; margin-top: 10px; padding: 8px; background: #f9f9f9; border-radius: 6px; }
        @media print {
            body { background: white; padding: 0; }
            .card { box-shadow: none; page-break-inside: avoid; margin: 10px 0; }
        }
        .print-btn {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #c41e3a;
            color: white;
            border: none;
            padding: 12px 24px;
            font-size: 16px;
            border-radius: 8px;
            cursor: pointer;
            z-index: 1000;
        }
        @media print { .print-btn { display: none; } }
    </style>
</head>
<body>
    <button class="print-btn" onclick="window.print()">Print All</button>
    <div class="cards-container">
        {$checkpointCards}
    </div>
</body>
</html>
HTML;

        return response($html, 200, ['Content-Type' => 'text/html']);
    }

    /**
     * Generate card HTML for bulk print
     */
    private function getCardHtml($checkpoint, $qrUrl, $logoUrl, $emergencyHotline, $siteName, $clientName, array $leaderInfo, $layout): string
    {
        $leaderPhoneHtml = $leaderInfo['phone'] ? "<div class='leader-phone'>{$leaderInfo['phone']}</div>" : '';

        if ($layout === 'landscape') {
            return <<<HTML
<div class="card landscape">
    <div class="card-header">
        <img src="{$logoUrl}" alt="Coin Security" class="logo">
        <div class="emergency-badge">Emergency: {$emergencyHotline}</div>
    </div>
    <div class="card-content">
        <div class="qr-section">
            <div class="qr-wrapper">
                <img src="{$qrUrl}" alt="QR" class="qr-code">
                <div class="qr-overlay"><img src="{$logoUrl}" alt="Coin"></div>
            </div>
        </div>
        <div class="info-section">
            <h2 class="checkpoint-name">{$checkpoint->name}</h2>
            <div class="site-info">{$siteName} - {$clientName}</div>
            <div class="leader-box">
                <div class="leader-type">{$leaderInfo['type']}</div>
                <div class="leader-name">{$leaderInfo['name']}</div>
                {$leaderPhoneHtml}
            </div>
            <div class="instructions">Scan during patrol to record checkpoint visit</div>
            <div class="qr-id">Code: {$checkpoint->code}</div>
        </div>
    </div>
</div>
HTML;
        }

        return <<<HTML
<div class="card portrait">
    <img src="{$logoUrl}" alt="Coin Security" class="logo">
    <div class="qr-wrapper">
        <img src="{$qrUrl}" alt="QR" class="qr-code">
        <div class="qr-overlay"><img src="{$logoUrl}" alt="Coin"></div>
    </div>
    <h2 class="checkpoint-name">{$checkpoint->name}</h2>
    <div class="site-info">{$siteName} - {$clientName}</div>
    <div class="leader-box">
        <div class="leader-type">{$leaderInfo['type']}</div>
        <div class="leader-name">{$leaderInfo['name']}</div>
        {$leaderPhoneHtml}
    </div>
    <div class="instructions">Scan during patrol to record checkpoint visit</div>
    <div class="qr-id">Code: {$checkpoint->code}</div>
</div>
HTML;
    }

    /**
     * Download all checkpoint QR codes as ZIP (for zone only)
     */
    public function downloadBulk()
    {
        $user = Auth::user();
        if (!$user->zone_id) {
            abort(403, 'No zone assigned.');
        }

        $tmpFile = tempnam(sys_get_temp_dir(), 'checkpoint_qr_') . '.zip';
        $zip = new ZipArchive();
        if ($zip->open($tmpFile, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            abort(500, 'Unable to create ZIP archive');
        }

        $checkpoints = Checkpoint::with(['clientSite.client'])
            ->whereHas('clientSite', function ($q) use ($user) {
                $q->where('zone_id', $user->zone_id);
            })
            ->get();

        foreach ($checkpoints as $cp) {
            $data = json_encode([
                'issuer' => 'CoinSecurity',
                'type' => 'checkpoint',
                'code' => $cp->code,
                'name' => $cp->name,
                'site_id' => $cp->client_site_id,
                'ver' => 'v2'
            ]);
            $url = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' . urlencode($data);
            $png = @file_get_contents($url);
            if ($png !== false) {
                $safeName = $cp->code . '_' . Str::slug($cp->name ?: ('checkpoint-'.$cp->id));
                $filename = 'checkpoints/' . $safeName . '.png';
                $withLogo = $this->overlayLogoOnPng($png);
                $zip->addFromString($filename, $withLogo);
                Storage::disk('public')->put('qr_codes/' . $filename, $withLogo);
            }
        }

        $zip->close();

        return new StreamedResponse(function() use ($tmpFile) {
            readfile($tmpFile);
        }, 200, [
            'Content-Type' => 'application/zip',
            'Content-Disposition' => 'attachment; filename="zone_checkpoints_qr_' . now()->format('Ymd_His') . '.zip"',
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
                return $pngBinary;
            }
            $logo = Image::make($logoPath);
            $target = (int) floor(min($qr->width(), $qr->height()) * 0.25);
            $logo->resize($target, $target, function ($constraint) {
                $constraint->aspectRatio();
                $constraint->upsize();
            });

            $bgSize = $target + 10;
            $bg = Image::canvas($bgSize, $bgSize, '#FFFFFF');
            $bg->insert($logo, 'center');

            $qr->insert($bg, 'center');
            return (string) $qr->encode('png');
        } catch (\Throwable $e) {
            report($e);
            return $pngBinary;
        }
    }
}
