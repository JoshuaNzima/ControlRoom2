<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Guards\{Guard, Client, ClientSite};
use Carbon\Carbon;

class GuardsModuleSeeder extends Seeder
{
    public function run(): void
    {
        // Create Clients
        $clients = [
            [
                'name' => 'City Shopping Mall',
                'contact_person' => 'John Manager',
                'phone' => '+265 999 123 456',
                'email' => 'john@citymall.com',
                'address' => 'Area 47, Lilongwe',
                'status' => 'active',
                'contract_start_date' => now()->subMonths(6),
            ],
            [
                'name' => 'National Bank Headquarters',
                'contact_person' => 'Sarah Director',
                'phone' => '+265 999 234 567',
                'email' => 'sarah@nationalbank.com',
                'address' => 'City Centre, Lilongwe',
                'status' => 'active',
                'contract_start_date' => now()->subYear(),
            ],
            [
                'name' => 'Industrial Park Complex',
                'contact_person' => 'Mike Operations',
                'phone' => '+265 999 345 678',
                'email' => 'mike@industrial.com',
                'address' => 'Area 18, Lilongwe',
                'status' => 'active',
                'contract_start_date' => now()->subMonths(3),
            ],
        ];

        foreach ($clients as $clientData) {
            $client = Client::create($clientData);
            
            // Create sites for each client
            $this->createSitesForClient($client);
        }

        // Create Guards
        $guards = [
            [
                'employee_id' => 'GRD001',
                'name' => 'James Banda',
                'phone' => '+265 888 111 222',
                'email' => 'james.banda@coinsec.com',
                'hire_date' => now()->subYear(),
                'status' => 'active',
            ],
            [
                'employee_id' => 'GRD002',
                'name' => 'Mary Phiri',
                'phone' => '+265 888 222 333',
                'email' => 'mary.phiri@coinsec.com',
                'hire_date' => now()->subMonths(8),
                'status' => 'active',
            ],
            [
                'employee_id' => 'GRD003',
                'name' => 'Peter Mwale',
                'phone' => '+265 888 333 444',
                'email' => 'peter.mwale@coinsec.com',
                'hire_date' => now()->subMonths(10),
                'status' => 'active',
            ],
            [
                'employee_id' => 'GRD004',
                'name' => 'Grace Kamanga',
                'phone' => '+265 888 444 555',
                'email' => 'grace.kamanga@coinsec.com',
                'hire_date' => now()->subMonths(5),
                'status' => 'active',
            ],
            [
                'employee_id' => 'GRD005',
                'name' => 'John Chirwa',
                'phone' => '+265 888 555 666',
                'email' => 'john.chirwa@coinsec.com',
                'hire_date' => now()->subMonths(3),
                'status' => 'active',
            ],
            [
                'employee_id' => 'GRD006',
                'name' => 'Lucy Tembo',
                'phone' => '+265 888 666 777',
                'email' => 'lucy.tembo@coinsec.com',
                'hire_date' => now()->subMonths(6),
                'status' => 'active',
            ],
            [
                'employee_id' => 'GRD007',
                'name' => 'Francis Zulu',
                'phone' => '+265 888 777 888',
                'email' => 'francis.zulu@coinsec.com',
                'hire_date' => now()->subMonths(7),
                'status' => 'active',
            ],
            [
                'employee_id' => 'GRD008',
                'name' => 'Catherine Nyirenda',
                'phone' => '+265 888 888 999',
                'email' => 'catherine.nyirenda@coinsec.com',
                'hire_date' => now()->subMonths(4),
                'status' => 'active',
            ],
        ];

        foreach ($guards as $guardData) {
            Guard::create($guardData);
        }
    }

    private function createSitesForClient($client): void
    {
        $sites = match ($client->name) {
            'City Shopping Mall' => [
                [
                    'name' => 'Main Entrance',
                    'address' => 'City Shopping Mall, Main Gate, Area 47',
                    'required_guards' => 2,
                ],
                [
                    'name' => 'Parking Area',
                    'address' => 'City Shopping Mall, Parking Lot, Area 47',
                    'required_guards' => 1,
                ],
            ],
            'National Bank Headquarters' => [
                [
                    'name' => 'Main Building',
                    'address' => 'National Bank HQ, Main Building, City Centre',
                    'required_guards' => 3,
                ],
            ],
            'Industrial Park Complex' => [
                [
                    'name' => 'Front Gate',
                    'address' => 'Industrial Park, Main Gate, Area 18',
                    'required_guards' => 2,
                ],
                [
                    'name' => 'Warehouse Section',
                    'address' => 'Industrial Park, Warehouse, Area 18',
                    'required_guards' => 1,
                ],
            ],
            default => [],
        };

        foreach ($sites as $siteData) {
            $client->sites()->create(array_merge($siteData, [
                'status' => 'active',
            ]));
        }
    }
}