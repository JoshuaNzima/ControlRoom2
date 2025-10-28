<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Zone;
use App\Models\Guards\ClientSite;
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
    public function index(Request $request)
    {
        $perPage = (int) ($request->input('per_page') ?: 20);

        $clients = Client::withCount(['sites', 'services'])
            ->with(['services' => function ($query) {
                $query->select('services.id', 'services.name', 'services.monthly_price')
                    ->withPivot('custom_price', 'quantity');
            }])
            ->when(request('search'), function($q, $search) {
                $q->where('name', 'like', "%{$search}%");
            })
            ->orderBy('name')
            ->paginate($perPage);

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

        return Inertia::render('Admin/Clients/Index', [
            'clients' => $clients,
            'filters' => array_merge(request()->only(['search']), ['per_page' => $perPage, 'show_add' => $request->input('show_add')]),
            'services' => $services,
            'zones' => $zones,
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
            'site.latitude' => 'nullable|numeric',
            'site.longitude' => 'nullable|numeric',
            'site.zone_id' => 'nullable|integer|exists:zones,id',
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
        ], $siteData);
        
        // If zone_id provided, ensure it's included in the site record
        $client->sites()->create($siteData);

        return redirect()->route('admin.clients.index')
            ->with('success', 'Client created successfully.');
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

        // include calculated monthly_rate
        $client->monthly_rate = $client->getMonthlyDueAmount();

        return response()->json($client);
    }

    public function edit(Client $client)
    {
        $client->load('services', 'sites');
        $services = \App\Models\Service::where('active', true)->orderBy('name')->get(['id','name','monthly_price']);
        return Inertia::render('Admin/Clients/Edit', [
            'client' => $client,
            'services' => $services,
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

        return redirect()->route('clients.index')
            ->with('success', 'Client updated successfully.');
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

        return redirect()->back()->with('success', 'Client services updated');
    }

    public function destroy(Client $client)
    {
        $client->delete();

        return redirect()->route('clients.index')
            ->with('success', 'Client deleted successfully.');
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
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'special_instructions' => 'nullable|string',
            'required_guards' => 'required|integer|min:1',
            'services_requested' => 'nullable|string',
            'status' => 'required|in:active,inactive',
        ]);

        $client->sites()->create($validated);

        // If the request expects JSON (AJAX from modal), return success so frontend can refresh
        if ($request->wantsJson() || $request->ajax()) {
            return response()->json(['success' => true]);
        }

        // Fallback redirect to index (standalone show page removed)
        return redirect()->route('admin.clients.index')
            ->with('success', 'Site added successfully.');
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

                return back()->with([
                    'success' => "Successfully imported {$results['success']} clients. Failed: {$results['failed']}",
                    'import_results' => $results,
                ]);
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
}