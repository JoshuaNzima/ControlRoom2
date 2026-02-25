<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Zone;
use App\Models\Guards\ClientSite;
use App\Models\Guards\GuardAssignment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class ClientController extends Controller
{
    public function dashboard()
    {
        // Simply redirect to clients index - the dashboard page is now just a redirect component
        return redirect()->route('admin.clients.index');
    }

    public function siteJson(Client $client, \App\Models\Guards\ClientSite $site)
    {
        abort_unless($site->client_id === $client->id, 404);
        return response()->json($site);
    }

    public function updateSite(Request $request, Client $client, \App\Models\Guards\ClientSite $site)
    {
        abort_unless($site->client_id === $client->id, 404);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'required|string',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'special_instructions' => 'nullable|string',
            'required_guards' => 'required|integer|min:1',
            'services_requested' => 'nullable|string',
            'status' => 'required|in:active,inactive',
            'zone_id' => 'nullable|integer|exists:zones,id',
            'site_type' => 'nullable|string|max:50',
        ]);

        $site->update($validated);

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json(['success' => true]);
        }

        return redirect()->route('admin.clients.edit', $client)
            ->withSuccess('Site updated successfully.');
    }
    public function index(Request $request)
    {
        $perPage = (int) ($request->input('per_page') ?: 20);

        $clients = Client::withCount(['sites', 'services'])
            ->with(['services' => function ($query) {
                $query->select('services.id', 'services.name', 'services.monthly_price')
                    ->withPivot('custom_price', 'quantity');
            }, 'supervisor:id,name', 'sergeant:id,name'])
            ->when(request('search'), function($q, $search) {
                $q->where('name', 'like', "%{$search}%");
            })
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString();

        // Calculate monthly rates for each client
        $clients->through(function ($client) {
            $client->monthly_rate = $client->getMonthlyDueAmount();
            return $client;
        });

        // Get all active services for the Add Client modal
        $services = \App\Models\Service::where('active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'monthly_price']);

        $zones = \App\Models\Zone::orderBy('name')->get(['id', 'name']);

        // Get supervisors and sergeants for assignment
        $supervisors = \App\Models\User::role('supervisor')->select(['id','name'])->orderBy('name')->get();
        $sergeants = \App\Models\Guards\Guard::select(['id','name','position'])
            ->where('status','active')
            ->where('position', 'sergeant')
            ->orderBy('name')
            ->get();

        return Inertia::render('Admin/Clients', [
            'clients' => $clients,
            'filters' => array_merge(request()->only(['search']), ['per_page' => $perPage, 'show_add' => $request->input('show_add')]),
            'services' => $services,
            'zones' => $zones,
            'supervisors' => $supervisors,
            'sergeants' => $sergeants,
        ]);
    }

    public function create()
    {
        // The separate create page has been deprecated in favor of the Add Client modal
        // Redirect to index and instruct the index page to open the modal via query param
        return redirect()->route('admin.clients.index', ['show_add' => 1]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email',
            'address' => 'nullable|string',
            'contract_start_date' => 'nullable|date',
            'contract_end_date' => 'nullable|date|after:contract_start_date',
            'monthly_rate' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
            'status' => 'required|in:active,inactive',
            'billing_start_date' => 'nullable|date',
            'services' => 'nullable|array',
            'services.*.id' => 'required_with:services|integer|exists:services,id',
            'services.*.custom_price' => 'nullable|numeric|min:0',
            'services.*.quantity' => 'nullable|integer|min:1',
            // Optional initial site
            'site.name' => 'nullable|string|max:255',
            'site.address' => 'nullable|string',
            'site.required_guards' => 'nullable|integer|min:1',
            'site.services_requested' => 'nullable|string',
            'site.status' => 'nullable|in:active,inactive',
            'site.contact_person' => 'nullable|string|max:255',
            'site.phone' => 'nullable|string|max:20',
            'site.special_instructions' => 'nullable|string',
            'site.latitude' => 'nullable|numeric|between:-90,90',
            'site.longitude' => 'nullable|numeric|between:-180,180',
            'site.zone_id' => 'nullable|integer|exists:zones,id',
            'site.site_type' => 'nullable|string|max:50',
        ]);

        $client = Client::create(collect($validated)->except(['site', 'services'])->toArray());

        // Attach services if provided (array of {id, custom_price})
        if (!empty($validated['services'])) {
            $attach = [];
            foreach ($validated['services'] as $svc) {
                $attach[(int) $svc['id']] = [
                    'custom_price' => isset($svc['custom_price']) ? $svc['custom_price'] : null,
                    'quantity' => $svc['quantity'] ?? 1
                ];
            }
            $client->services()->attach($attach);
            
            // Refresh the monthly rate based on attached services
            $client->refresh();  // Reload relations
            $client->monthly_rate = $client->getMonthlyDueAmount();
            $client->save();
        }

        // Create default site if no site is provided, or create the specified site
        $siteData = !empty($validated['site']) ? $validated['site'] : [];
        $siteData = array_merge([
            'name' => 'Home/Residence',
            'status' => 'active',
            'required_guards' => 1,
            'address' => $validated['address'] ?? '',
            'contact_person' => $validated['contact_person'] ?? '',
            'phone' => $validated['phone'] ?? '',
            'site_type' => $siteData['site_type'] ?? 'residential',
        ], $siteData);
        
        // If zone_id provided, ensure it's included in the site record
        $client->sites()->create($siteData);

        return redirect()->route('admin.clients.index')
            ->withSuccess('Client created successfully.');
    }

    public function show(Client $client)
    {
        $client->load([
            'sites',
            'services' => function ($query) {
                $query->select('services.id', 'services.name', 'services.monthly_price')
                    ->withPivot('custom_price', 'quantity');
            }
        ]);

        // Calculate monthly rate based on services
        $client->monthly_rate = $client->getMonthlyDueAmount();

        return Inertia::render('Admin/Clients/Show', [
            'client' => $client,
        ]);
    }

    /**
     * Return full client JSON (services & sites) for XHR/modal pre-fill
     */
    public function apiShow(Client $client)
    {
        $client->load([
            'sites',
            'services' => function ($query) {
                $query->select('services.id', 'services.name', 'services.monthly_price')
                    ->withPivot('custom_price', 'quantity');
            }
        ]);

        $siteIds = $client->sites->pluck('id')->filter()->values();
        if ($siteIds->isNotEmpty()) {
            $requiredBySite = \App\Models\Guards\ClientSite::requiredGuardsBySiteFromScheduleShifts($siteIds->all());

            $counts = GuardAssignment::query()
                ->select('client_site_id', DB::raw('COUNT(DISTINCT guard_id) as guard_count'))
                ->whereIn('client_site_id', $siteIds)
                ->where('is_active', true)
                ->where('start_date', '<=', today())
                ->where(function ($q) {
                    $q->whereNull('end_date')->orWhere('end_date', '>=', today());
                })
                ->groupBy('client_site_id')
                ->pluck('guard_count', 'client_site_id');

            $client->sites->each(function ($site) use ($counts, $requiredBySite) {
                $derivedRequired = (int) ($requiredBySite[$site->id] ?? 0);
                if ($derivedRequired > 0) {
                    $site->setAttribute('required_guards', $derivedRequired);
                }
                $site->setAttribute('guard_count', (int) ($counts[$site->id] ?? 0));
            });
        }

        // include calculated monthly_rate
        $client->monthly_rate = $client->getMonthlyDueAmount();

        return response()->json($client);
    }

    /**
     * Lightweight JSON list of active client sites with client name, for assignment pickers.
     */
    public function sitesJson(Request $request)
    {
        $search = trim((string) $request->input('search', ''));
        $zoneId = $request->input('zone_id');

        $sites = \App\Models\Guards\ClientSite::query()
            ->with(['client' => function ($q) { $q->select('id', 'name'); }])
            ->where('status', 'active')
            ->when($zoneId, function ($q) use ($zoneId) {
                // zone_id may exist on client_sites
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

    public function edit(Client $client)
    {
        $client->load('services', 'sites');
        $services = \App\Models\Service::where('active', true)->orderBy('name')->get(['id','name','monthly_price']);
        $zones = Zone::orderBy('name')->get(['id','name']);
        return Inertia::render('Admin/Clients/Edit', [
            'client' => $client,
            'services' => $services,
            'zones' => $zones,
        ]);
    }

    public function update(Request $request, Client $client)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email',
            'address' => 'nullable|string',
            'contract_start_date' => 'nullable|date',
            'contract_end_date' => 'nullable|date|after:contract_start_date',
            'monthly_rate' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
            'status' => 'required|in:active,inactive',
            'services' => 'nullable|array',
            'services.*.id' => 'required_with:services|integer|exists:services,id',
            'services.*.custom_price' => 'nullable|numeric|min:0',
        ]);

        $client->update($validated);

        // Sync services if provided
        if (array_key_exists('services', $validated)) {
            $sync = [];
            foreach ($validated['services'] as $svc) {
                $sync[(int) $svc['id']] = [
                    'custom_price' => $svc['custom_price'] ?? null,
                    'quantity' => $svc['quantity'] ?? 1
                ];
            }
            $client->services()->sync($sync);
            
            // Update monthly rate based on services
            $client->monthly_rate = $client->getMonthlyDueAmount();
            $client->save();
        }

        return redirect()->route('admin.clients.index')
            ->withSuccess('Client updated successfully.');
    }

    // Update just the services/pivot for a client (custom prices)
    public function updateServices(Request $request, Client $client)
    {
        $validated = $request->validate([
            'services' => 'nullable|array',
            'services.*.id' => 'required_with:services|integer|exists:services,id',
            'services.*.custom_price' => 'nullable|numeric|min:0',
            'services.*.quantity' => 'nullable|integer|min:1',
        ]);

        $sync = [];
        foreach (($validated['services'] ?? []) as $svc) {
            $sync[(int) $svc['id']] = [
                'custom_price' => $svc['custom_price'] ?? null,
                'quantity' => $svc['quantity'] ?? 1
            ];
        }

        $client->services()->sync($sync);

        return redirect()->back()->withSuccess('Client services updated');
    }

    public function destroy(Client $client)
    {
        $client->delete();

        return redirect()->route('admin.clients.index')
            ->withSuccess('Client deleted successfully.');
    }

    // Site management
    public function createSite(Client $client)
    {
        return Inertia::render('Admin/Clients/CreateSite', [
            'client' => $client,
        ]);
    }

    public function storeSite(Request $request, Client $client)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'required|string',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'special_instructions' => 'nullable|string',
            'required_guards' => 'required|integer|min:1',
            'services_requested' => 'nullable|string',
            'status' => 'required|in:active,inactive',
            'zone_id' => 'nullable|integer|exists:zones,id',
            'site_type' => 'nullable|string|max:50',
        ]);

        $client->sites()->create($validated);

        // If the request expects JSON (AJAX from modal), return success so frontend can refresh
        if ($request->wantsJson() || $request->ajax()) {
            return response()->json(['success' => true]);
        }

        // Fallback redirect to index (standalone show page removed)
        return redirect()->route('admin.clients.index')
            ->withSuccess('Site added successfully.');
    }

    public function destroySite(Request $request, Client $client, \App\Models\Guards\ClientSite $site)
    {
        abort_unless($site->client_id === $client->id, 404);

        $site->delete();

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json(['success' => true]);
        }

        return redirect()->route('admin.clients.edit', $client)
            ->withSuccess('Site removed successfully.');
    }

    /**
     * Return soft-deleted sites for a client (for restore UI)
     */
    public function deletedSitesJson(Request $request, Client $client)
    {
        $trashed = ClientSite::onlyTrashed()
            ->where('client_id', $client->id)
            ->orderByDesc('deleted_at')
            ->get(['id', 'name', 'address', 'deleted_at', 'status']);

        return response()->json($trashed);
    }

    /**
     * Restore a soft-deleted site. Route-model binding does not bind trashed models by default,
     * so we fetch withTrashed() using the numeric ID.
     */
    public function restoreSite(Request $request, Client $client, $site)
    {
        $model = ClientSite::withTrashed()->where('id', $site)->firstOrFail();
        abort_unless($model->client_id === $client->id, 404);
        $model->restore();

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json(['success' => true]);
        }

        return redirect()->route('admin.clients.edit', $client)
            ->withSuccess('Site restored successfully.');
    }

    public function bulkUpdateSites(Request $request)
    {
        $validated = $request->validate([
            'site_ids' => ['required', 'array', 'min:1'],
            'site_ids.*' => ['integer', 'exists:client_sites,id'],
            'action' => ['required', 'in:activate,deactivate,move_zone,set_required_guards'],
            'zone_id' => ['nullable', 'integer', 'exists:zones,id'],
            'required_guards' => ['nullable', 'integer', 'min:1'],
        ]);

        $updated = 0;

        $affectedZoneIds = ClientSite::query()
            ->whereIn('id', $validated['site_ids'])
            ->pluck('zone_id')
            ->filter()
            ->unique()
            ->values()
            ->all();

        if ($validated['action'] === 'activate') {
            $updated = ClientSite::whereIn('id', $validated['site_ids'])->update(['status' => 'active']);
        } elseif ($validated['action'] === 'deactivate') {
            $updated = ClientSite::whereIn('id', $validated['site_ids'])->update(['status' => 'inactive']);
        } elseif ($validated['action'] === 'move_zone') {
            if (empty($validated['zone_id'])) {
                if ($request->wantsJson() || $request->ajax()) {
                    return response()->json(['success' => false, 'message' => 'zone_id is required for move_zone'], 422);
                }
                return redirect()->back()->withErrors(['zone_id' => 'Zone is required for move operation.']);
            }
            $updated = ClientSite::whereIn('id', $validated['site_ids'])->update(['zone_id' => $validated['zone_id']]);
            if ($validated['zone_id']) {
                $affectedZoneIds[] = (int) $validated['zone_id'];
            }
        } elseif ($validated['action'] === 'set_required_guards') {
            if (!isset($validated['required_guards'])) {
                if ($request->wantsJson() || $request->ajax()) {
                    return response()->json(['success' => false, 'message' => 'required_guards is required for this action'], 422);
                }
                return redirect()->back()->withErrors(['required_guards' => 'Required guards value is needed.']);
            }
            $updated = ClientSite::whereIn('id', $validated['site_ids'])->update(['required_guards' => $validated['required_guards']]);
        }

        $affectedZoneIds = array_values(array_unique(array_filter($affectedZoneIds)));

        foreach ($affectedZoneIds as $zoneId) {
            try {
                $sum = ClientSite::query()
                    ->where('zone_id', $zoneId)
                    ->where('status', 'active')
                    ->sum('required_guards');

                Zone::whereKey($zoneId)->update(['required_guard_count' => (int) $sum]);
            } catch (\Throwable $e) {
            }
        }

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json(['success' => true, 'updated' => $updated]);
        }

        return redirect()->back()->withSuccess('Updated ' . $updated . ' sites.');
    }

    public function bulkImport(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv',
        ]);

        try {
            $file = $request->file('file');
            $spreadsheet = IOFactory::load($file->getPathname());
            $worksheet = $spreadsheet->getActiveSheet();
            $rows = $worksheet->toArray();

            // Remove header row
            array_shift($rows);

            $results = [
                'success' => 0,
                'failed' => 0,
                'errors' => []
            ];

            DB::beginTransaction();

            try {
                foreach ($rows as $index => $row) {
                    $validator = Validator::make([
                        'name' => $row[0],
                        'contact_person' => $row[1],
                        'phone' => $row[2],
                        'email' => $row[3],
                        'billing_start_date' => $row[4],
                        'status' => 'active',
                        'monthly_rate' => 0,
                    ], [
                        'name' => 'required|string|max:255',
                        'contact_person' => 'nullable|string|max:255',
                        'phone' => 'nullable|string|max:20',
                        'email' => 'nullable|email|max:255',
                        'billing_start_date' => 'nullable|date',
                        'status' => 'required|in:active,inactive',
                        'monthly_rate' => 'required|numeric|min:0',
                    ]);

                    if ($validator->fails()) {
                        $results['failed']++;
                        $results['errors'][] = "Row " . ($index + 2) . ": " . implode(', ', $validator->errors()->all());
                        continue;
                    }

                    $validatedData = $validator->validated();
                    $client = Client::create($validatedData);
                    
                    // Create a default site for the client
                    $client->sites()->create([
                        'name' => 'Home/Residence',
                        'address' => '',
                        'status' => 'active',
                        'contact_person' => $validatedData['contact_person'] ?? '',
                        'phone' => $validatedData['phone'] ?? '',
                        'special_instructions' => '',
                        'required_guards' => 1,
                    ]);
                    
                    $results['success']++;
                }

                DB::commit();

                return back()
                    ->with('import_results', $results)
                    ->withSuccess("Successfully imported {$results['success']} clients. Failed: {$results['failed']}");
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Exception $e) {
            return back()->withErrors([
                'file' => 'Failed to process import file: ' . $e->getMessage(),
            ]);
        }
    }

    public function bulkImportTemplate()
    {
        $headers = ['Name', 'Contact Person', 'Phone', 'Email', 'Billing Start Date'];
        $example = ['Example Company', 'John Doe', '+123456789', 'john@example.com', '2024-01-01'];

        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // Set headers using cell references
        $sheet->setCellValue('A1', 'Name');
        $sheet->setCellValue('B1', 'Contact Person');
        $sheet->setCellValue('C1', 'Phone');
        $sheet->setCellValue('D1', 'Email');
        $sheet->setCellValue('E1', 'Billing Start Date');

        // Set example row
        $sheet->setCellValue('A2', 'Example Company');
        $sheet->setCellValue('B2', 'John Doe');
        $sheet->setCellValue('C2', '+123456789');
        $sheet->setCellValue('D2', 'john@example.com');
        $sheet->setCellValue('E2', '2024-01-01');

        // Auto-size columns
        foreach (range('A', 'E') as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }

        // Style headers
        $headerRange = 'A1:E1';
        $sheet->getStyle($headerRange)->getFont()->setBold(true);
        $sheet->getStyle($headerRange)->getFill()
            ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
            ->getStartColor()->setRGB('EEEEEE');

        // Create response
        $writer = IOFactory::createWriter($spreadsheet, 'Xlsx');
        $tempFile = tempnam(sys_get_temp_dir(), 'client_template_');
        $writer->save($tempFile);

        return response()->download(
            $tempFile,
            'client_import_template.xlsx',
            ['Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
        )->deleteFileAfterSend(true);
    }

    /**
     * Toggle client status between active and inactive.
     * Deactivating a client preserves all data but prevents new assignments.
     */
    public function toggleStatus(Request $request, Client $client)
    {
        $validated = $request->validate([
            'status' => ['required', 'in:active,inactive'],
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        $newStatus = $validated['status'];
        $oldStatus = $client->status;

        // Update client status
        $client->update(['status' => $newStatus]);

        // Also update all sites to match client status
        $client->sites()->update(['status' => $newStatus]);

        // Log the status change (optional audit trail)
        if (class_exists(\App\Models\AuditLog::class)) {
            \App\Models\AuditLog::create([
                'user_id' => auth()->id(),
                'action' => 'client_status_changed',
                'entity_type' => Client::class,
                'entity_id' => $client->id,
                'old_values' => ['status' => $oldStatus],
                'new_values' => ['status' => $newStatus, 'reason' => $validated['reason'] ?? null],
                'description' => "Client '{$client->name}' status changed from {$oldStatus} to {$newStatus}",
            ]);
        }

        $message = $newStatus === 'active' 
            ? "Client '{$client->name}' has been activated." 
            : "Client '{$client->name}' has been deactivated. All sites are now inactive.";

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'status' => $newStatus,
                'message' => $message,
            ]);
        }

        return redirect()->back()->with('success', $message);
    }

    public function assignSupervisor(Request $request, Client $client)
    {
        $data = $request->validate([
            'supervisor_id' => ['required', 'exists:users,id'],
        ]);

        $client->supervisor_id = $data['supervisor_id'];
        $client->save();

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json(['success' => true, 'message' => 'Supervisor assigned successfully.']);
        }

        return back()->with('success', 'Supervisor assigned to client.');
    }

    public function unassignSupervisor(Request $request, Client $client)
    {
        $client->supervisor_id = null;
        $client->save();

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json(['success' => true, 'message' => 'Supervisor unassigned successfully.']);
        }

        return back()->with('success', 'Supervisor unassigned from client.');
    }

    public function assignSergeant(Request $request, Client $client)
    {
        $data = $request->validate([
            'sergeant_id' => ['required', 'exists:guards,id'],
        ]);

        // Validate the guard is actually a sergeant
        $sergeant = \App\Models\Guards\Guard::findOrFail($data['sergeant_id']);
        if (!$sergeant->isLeader() && $sergeant->position !== 'sergeant') {
            return response()->json(['success' => false, 'message' => 'Selected guard is not a sergeant.'], 422);
        }

        $client->sergeant_id = $data['sergeant_id'];
        $client->save();

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json(['success' => true, 'message' => 'Sergeant assigned successfully.']);
        }

        return back()->with('success', 'Sergeant assigned to client.');
    }

    public function unassignSergeant(Request $request, Client $client)
    {
        $client->sergeant_id = null;
        $client->save();

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json(['success' => true, 'message' => 'Sergeant unassigned successfully.']);
        }

        return back()->with('success', 'Sergeant unassigned from client.');
    }
}