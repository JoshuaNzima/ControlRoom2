<?php

namespace App\Http\Controllers\ControlRoom;

use App\Http\Controllers\Controller;
use App\Models\Guards\Client;
use App\Models\Guards\ClientSite;
use App\Models\Guards\Guard;
use App\Models\Zone;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ClientsController extends Controller
{
	public function index()
	{
		$clients = Client::withCount('sites')
			->when(request('search'), function($q, $search) {
				$q->where('name', 'like', "%{$search}%");
			})
			->when(request('status'), function($q, $status){
				$q->where('status', $status);
			})
			->orderBy('name')
			->paginate(20);

		return Inertia::render('ControlRoom/Clients/Index', [
			'clients' => $clients,
			'filters' => request()->only(['search','status']),
		]);
	}

	public function show(Client $client)
	{
		$client->load(['sites' => function($q){ $q->select(['id','client_id','name','status']); }]);
		$guards = Guard::select(['id','name','status','position'])->where('status','active')->orderBy('name')->get();
		$supervisors = User::role('supervisor')->select(['id','name'])->orderBy('name')->get();
		$sergeants = Guard::select(['id','name','position'])
			->where('status','active')
			->where('position', 'sergeant')
			->orderBy('name')
			->get();

		$assignmentsBySite = \App\Models\Guards\GuardAssignment::with(['assignedGuard:id,name','clientSite:id,name'])
			->whereIn('client_site_id', $client->sites->pluck('id'))
			->where('is_active', true)
			->get()
			->groupBy('client_site_id')
			->map(function($group) {
				return $group->map(function($a){
					return [
						'id' => $a->id,
						'guard' => $a->assignedGuard?->only(['id','name']),
						'client_site_id' => $a->client_site_id,
					];
				});
			});

		return Inertia::render('ControlRoom/Clients/Show', [
			'client' => $client,
			'guards' => $guards,
			'supervisors' => $supervisors,
			'sergeants' => $sergeants,
			'assignmentsBySite' => $assignmentsBySite,
		]);
	}

	public function assignGuard(Request $request, Client $client)
	{
		$data = $request->validate([
			'guard_id' => ['required','exists:guards,id'],
		]);

		// business rule: assign a guard to all client sites as active assignment (simplified)
		foreach ($client->sites as $site) {
			\App\Models\Guards\GuardAssignment::firstOrCreate([
				'guard_id' => $data['guard_id'],
				'client_site_id' => $site->id,
			], [
				'assigned_by' => $request->user()?->id,
				'start_date' => now()->startOfDay(),
				'is_active' => true,
			]);
		}

		return back()->with('success', 'Guard assigned to client');
	}

	public function assignSupervisor(Request $request, Client $client)
	{
		$data = $request->validate([
			'supervisor_id' => ['required','exists:users,id'],
		]);

		$client->supervisor_id = $data['supervisor_id'];
		$client->save();

		return back()->with('success', 'Supervisor assigned to client');
	}

	public function assignSergeant(Request $request, Client $client)
	{
		$data = $request->validate([
			'sergeant_id' => ['required', 'exists:guards,id'],
		]);

		// Validate the guard is actually a sergeant
		$sergeant = Guard::findOrFail($data['sergeant_id']);
		if (!$sergeant->isLeader() && $sergeant->position !== 'sergeant') {
			return response()->json(['success' => false, 'message' => 'Selected guard is not a sergeant.'], 422);
		}

		$client->sergeant_id = $data['sergeant_id'];
		$client->save();

		if ($request->wantsJson() || $request->ajax()) {
			return response()->json(['success' => true, 'message' => 'Sergeant assigned successfully.']);
		}

		return back()->with('success', 'Sergeant assigned to client');
	}

	public function unassignSergeant(Request $request, Client $client)
	{
		$client->sergeant_id = null;
		$client->save();

		if ($request->wantsJson() || $request->ajax()) {
			return response()->json(['success' => true, 'message' => 'Sergeant unassigned successfully.']);
		}

		return back()->with('success', 'Sergeant unassigned from client');
	}

	public function sitesJson(Request $request)
	{
		$search = trim((string) $request->input('search', ''));
		$zoneId = $request->input('zone_id');

		$sites = \App\Models\Guards\ClientSite::query()
			->with(['client' => function ($q) { $q->select('id', 'name'); }])
			->where('status', 'active')
			->when($zoneId, function ($q) use ($zoneId) {
				$q->where('zone_id', $zoneId);
			})
			->when($search, function ($q) use ($search) {
				$q->where(function ($qq) use ($search) {
					$qq->where('name', 'like', "%{$search}%")
					   ->orWhereHas('client', function ($qc) use ($search) {
						   $qc->where('name', 'like', "%{$search}%");
					   });
				});
			})
			->orderBy('name')
			->limit(50)
			->get(['id', 'client_id', 'name', 'status']);

		$payload = $sites->map(function ($site) {
			return [
				'id' => $site->id,
				'name' => $site->name,
				'client_name' => optional($site->client)->name,
			];
		});

		return response()->json($payload);
	}

	public function siteQr(ClientSite $site)
	{
		$site->load(['client:id,name']);

		// Ensure site has a QR code (generate if missing)
		if (!$site->qr_code) {
			$site->qr_code = ClientSite::generateUniqueQrCode();
			\DB::table('client_sites')->where('id', $site->id)->update(['qr_code' => $site->qr_code]);
		}

		$payload = [
			'issuer' => 'CoinSecurity',
			'type' => 'site',
			'site_id' => $site->id,
			'code' => $site->qr_code,
			'site_name' => $site->name,
			'client' => optional($site->client)->name,
			'lat' => $site->latitude !== null ? (float) $site->latitude : null,
			'lng' => $site->longitude !== null ? (float) $site->longitude : null,
			'ver' => 'v2',
		];

		$url = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' . urlencode(json_encode($payload));
		$png = @file_get_contents($url);
		if ($png === false) {
			return $this->errorResponse('QR generation failed.', 502);
		}

		return response($png, 200, ['Content-Type' => 'image/png']);
	}

	public function siteQrPrint(ClientSite $site, Request $request)
	{
		$site->load(['client:id,name']);

		// Ensure site has a QR code (generate if missing)
		if (!$site->qr_code) {
			$site->qr_code = ClientSite::generateUniqueQrCode();
			\DB::table('client_sites')->where('id', $site->id)->update(['qr_code' => $site->qr_code]);
		}

		$layout = $request->query('layout', 'portrait'); // portrait or landscape

		$payload = [
			'issuer' => 'CoinSecurity',
			'type' => 'site',
			'site_id' => $site->id,
			'code' => $site->qr_code,
			'site_name' => $site->name,
			'client' => optional($site->client)->name,
			'lat' => $site->latitude !== null ? (float) $site->latitude : null,
			'lng' => $site->longitude !== null ? (float) $site->longitude : null,
			'ver' => 'v2',
		];

		$qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=' . urlencode(json_encode($payload));
		$logoUrl = asset('images/Coin-logo.png');
		$emergencyHotline = config('app.emergency_hotline', '+265 999 611 711');
		$clientName = optional($site->client)->name ?? 'Unknown Client';
		$currentUrl = url()->full();
		$alternateLayoutUrl = $layout === 'portrait' 
			? url()->current() . '?layout=landscape' 
			: url()->current() . '?layout=portrait';
		$alternateLayoutLabel = $layout === 'portrait' ? 'Switch to Landscape' : 'Switch to Portrait';

		// Get supervisor/sergeant for this site, fallback to zone commander
		$leaderInfo = $this->getSiteLeaderInfo($site);

		if ($layout === 'landscape') {
			$html = $this->getLandscapeLayout($site, $qrUrl, $logoUrl, $emergencyHotline, $clientName, $alternateLayoutUrl, $alternateLayoutLabel, $leaderInfo);
		} else {
			$html = $this->getPortraitLayout($site, $qrUrl, $logoUrl, $emergencyHotline, $clientName, $alternateLayoutUrl, $alternateLayoutLabel, $leaderInfo);
		}

		return response($html, 200, ['Content-Type' => 'text/html']);
	}

	/**
	 * Get supervisor/sergeant assigned to site, or zone commander as fallback
	 */
	private function getSiteLeaderInfo(ClientSite $site): array
	{
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

		// Fallback to zone commander (avoid relying on ClientSite::zone relationship)
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

	private function getPortraitLayout($site, $qrUrl, $logoUrl, $emergencyHotline, $clientName, $alternateLayoutUrl, $alternateLayoutLabel, array $leaderInfo)
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
	<title>{$site->name} - QR Code</title>
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
		.site-name {
			font-size: 28px;
			font-weight: bold;
			color: #1a1a1a;
			margin: 25px 0 10px;
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
		.emergency-icon {
			font-size: 24px;
			margin-bottom: 8px;
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
		
		<h1 class="site-name">{$site->name}</h1>
		
		<div class="divider"></div>
		
		<div class="emergency">
			<div class="emergency-icon">&#128222;</div>
			<div class="emergency-label">Emergency Hotline</div>
			<div class="emergency-number">{$emergencyHotline}</div>
		</div>
		
		<div class="leader-banner">
			<div class="leader-type">{$leaderType}</div>
			<div class="leader-name">{$leaderName}</div>
			{$leaderPhoneHtml}
		</div>
		
		<div class="instructions">
			<strong>Scan to Check In</strong><br>
			Please scan this QR code when you arrive at the site. 
			GPS verification required.
		</div>
		
		<div class="qr-id">QR ID: {$site->qr_code}</div>
		
		<div class="no-print">
			<button class="layout-toggle" onclick="window.location.href='{$alternateLayoutUrl}'">{$alternateLayoutLabel}</button>
			<button class="print-btn" onclick="window.print()">Print QR Code</button>
		</div>
	</div>
</body>
</html>
HTML;
	}

	private function getLandscapeLayout($site, $qrUrl, $logoUrl, $emergencyHotline, $clientName, $alternateLayoutUrl, $alternateLayoutLabel, array $leaderInfo)
	{
		$leaderType = $leaderInfo['type'];
		$leaderName = $leaderInfo['name'];
		$leaderPhone = $leaderInfo['phone'] ?? '';
		$leaderPhoneHtml = $leaderPhone ? "<div class='leader-phone'><i class='fas fa-phone'></i> {$leaderPhone}</div>" : '';
		
		return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>{$site->name} - QR Code</title>
	<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
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
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 8px;
		}
		.emergency-icon {
			font-size: 40px;
			margin-bottom: 5px;
		}
		.emergency-label {
			font-size: 16px;
			text-transform: uppercase;
			letter-spacing: 2px;
			font-weight: bold;
			display: flex;
			align-items: center;
			gap: 8px;
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
		.site-info {
			flex: 1;
			min-width: 320px;
			text-align: left;
			display: flex;
			flex-direction: column;
			justify-content: center;
		}
		.site-name {
			font-size: 42px;
			font-weight: bold;
			color: #1a1a1a;
			margin-bottom: 12px;
			line-height: 1.2;
		}
		.client-name {
			font-size: 26px;
			color: #666;
			margin-bottom: 30px;
			display: flex;
			align-items: center;
			gap: 10px;
		}
		.client-name i {
			color: #c41e3a;
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
			display: flex;
			align-items: center;
			gap: 10px;
			font-size: 20px;
			color: #1a1a1a;
			margin-bottom: 8px;
		}
		.instructions strong i {
			color: #c41e3a;
		}
		.qr-id {
			font-family: monospace;
			font-size: 16px;
			color: #666;
			word-break: break-all;
			padding: 12px;
			background: #f5f5f5;
			border-radius: 6px;
			display: flex;
			align-items: center;
			gap: 8px;
		}
		.qr-id i {
			color: #c41e3a;
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
			display: flex;
			align-items: center;
			gap: 10px;
		}
		.leader-phone i {
			color: #c41e3a;
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
			display: inline-flex;
			align-items: center;
			gap: 10px;
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
			display: inline-flex;
			align-items: center;
			gap: 8px;
		}
		.layout-toggle:hover { background: #555; }
	</style>
</head>
<body>
	<div class="print-container">
		<div class="landscape-header">
			<img src="{$logoUrl}" alt="Coin Security Logo" class="logo">
			<div class="emergency-banner">
				<div class="emergency-icon"><i class="fas fa-phone-volume"></i></div>
				<div class="emergency-label"><i class="fas fa-exclamation-circle"></i> Emergency Hotline</div>
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
			
			<div class="site-info">
				<h1 class="site-name">{$site->name}</h1>
				<!-- <p class="client-name"><i class="fas fa-building"></i> {$clientName}</p> -->
				
				<div class="instructions">
					<strong><i class="fas fa-qrcode"></i> Scan to Check In</strong>
					Please scan this QR code when you arrive at the site. <br>
					<i class="fas fa-map-marker-alt" style="color: #c41e3a;"></i> GPS verification required within 10 meters radius.
				</div>
				
				<div class="qr-id"><i class="fas fa-fingerprint"></i> QR ID: {$site->qr_code}</div>
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
			<button class="layout-toggle" onclick="window.location.href='{$alternateLayoutUrl}'"><i class="fas fa-sync-alt"></i> {$alternateLayoutLabel}</button>
			<button class="print-btn" onclick="window.print()"><i class="fas fa-print"></i> Print QR Code</button>
		</div>
	</div>
</body>
</html>
HTML;
	}
}
