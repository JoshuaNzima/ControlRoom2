<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\ClientSite;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\IOFactory;

class BulkClientImportController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv'
        ]);

        $file = $request->file('file');
        $spreadsheet = IOFactory::load($file);
        $worksheet = $spreadsheet->getActiveSheet();
        $rows = $worksheet->toArray();

        // Remove header row
        array_shift($rows);

        DB::beginTransaction();
        try {
            foreach ($rows as $row) {
                if (empty($row[0])) continue; // Skip empty rows

                // Create client
                $client = Client::create([
                    'name' => $row[0],
                    'contact_person' => $row[1] ?? null,
                    'phone' => $row[2] ?? null,
                    'email' => $row[3] ?? null,
                    'address' => $row[4] ?? null,
                    'contract_start_date' => !empty($row[5]) ? date('Y-m-d', strtotime($row[5])) : null,
                    'contract_end_date' => !empty($row[6]) ? date('Y-m-d', strtotime($row[6])) : null,
                    'monthly_rate' => $row[7] ?? 0,
                    'billing_start_date' => !empty($row[8]) ? date('Y-m-d', strtotime($row[8])) : null,
                    'notes' => $row[9] ?? null,
                    'status' => 'active'
                ]);

                // Create initial site if site data is provided
                if (!empty($row[10])) {
                    ClientSite::create([
                        'client_id' => $client->id,
                        'name' => $row[10],
                        'address' => $row[11] ?? null,
                        'required_guards' => $row[12] ?? 1,
                        'services_requested' => $row[13] ?? null,
                        'status' => 'active',
                        'contact_person' => $row[14] ?? null,
                        'phone' => $row[15] ?? null,
                        'special_instructions' => $row[16] ?? null,
                        'latitude' => $row[17] ?? null,
                        'longitude' => $row[18] ?? null,
                    ]);
                }
            }

            DB::commit();
            return back()->with('success', 'Clients imported successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Error importing clients: ' . $e->getMessage()]);
        }
    }
}