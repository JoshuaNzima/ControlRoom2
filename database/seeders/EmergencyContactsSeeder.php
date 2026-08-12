<?php

namespace Database\Seeders;

use App\Models\EmergencyContact;
use Illuminate\Database\Seeder;

class EmergencyContactsSeeder extends Seeder
{
    public function run(): void
    {
        $contacts = [
            // Police Stations
            [
                'name' => 'Lilongwe Police Station',
                'type' => 'police',
                'phone' => '+265 1 751 333',
                'alternative_phone' => '+265 1 751 334',
                'email' => null,
                'address' => 'Lilongwe City Centre, Malawi',
                'latitude' => -13.9626,
                'longitude' => 33.7741,
                'notes' => 'Main police station for Lilongwe area',
                'display_order' => 1,
            ],
            [
                'name' => 'Blantyre Police Station',
                'type' => 'police',
                'phone' => '+265 1 820 111',
                'alternative_phone' => null,
                'email' => null,
                'address' => 'Blantyre City Centre, Malawi',
                'latitude' => -15.7861,
                'longitude' => 35.0050,
                'notes' => 'Main police station for Blantyre area',
                'display_order' => 2,
            ],
            [
                'name' => 'Mzuzu Police Station',
                'type' => 'police',
                'phone' => '+265 1 321 000',
                'alternative_phone' => null,
                'email' => null,
                'address' => 'Mzuzu City Centre, Malawi',
                'latitude' => -11.4650,
                'longitude' => 34.0207,
                'notes' => 'Main police station for Mzuzu area',
                'display_order' => 3,
            ],

            // Hospitals
            [
                'name' => 'Kamuzu Central Hospital',
                'type' => 'hospital',
                'phone' => '+265 1 711 555',
                'alternative_phone' => '+265 1 711 556',
                'email' => null,
                'address' => 'Lilongwe, Malawi',
                'latitude' => -13.9899,
                'longitude' => 33.7700,
                'notes' => 'Main referral hospital in Lilongwe - 24/7 Emergency Services',
                'display_order' => 1,
            ],
            [
                'name' => 'Queen Elizabeth Central Hospital',
                'type' => 'hospital',
                'phone' => '+265 1 873 333',
                'alternative_phone' => '+265 1 873 334',
                'email' => null,
                'address' => 'Blantyre, Malawi',
                'latitude' => -15.7967,
                'longitude' => 35.0250,
                'notes' => 'Main referral hospital in Blantyre - 24/7 Emergency Services',
                'display_order' => 2,
            ],
            [
                'name' => 'Mzuzu Central Hospital',
                'type' => 'hospital',
                'phone' => '+265 1 321 333',
                'alternative_phone' => null,
                'email' => null,
                'address' => 'Mzuzu, Malawi',
                'latitude' => -11.4750,
                'longitude' => 34.0300,
                'notes' => 'Main referral hospital in Mzuzu',
                'display_order' => 3,
            ],

            // Ambulance Services
            [
                'name' => 'Lilongwe Ambulance Service',
                'type' => 'ambulance',
                'phone' => '+265 1 711 555',
                'alternative_phone' => '997',
                'email' => null,
                'address' => 'Lilongwe, Malawi',
                'latitude' => -13.9899,
                'longitude' => 33.7700,
                'notes' => 'Emergency ambulance service - Dial 997',
                'display_order' => 1,
            ],
            [
                'name' => 'Blantyre Ambulance Service',
                'type' => 'ambulance',
                'phone' => '+265 1 873 333',
                'alternative_phone' => '997',
                'email' => null,
                'address' => 'Blantyre, Malawi',
                'latitude' => -15.7967,
                'longitude' => 35.0250,
                'notes' => 'Emergency ambulance service - Dial 997',
                'display_order' => 2,
            ],

            // Fire Stations
            [
                'name' => 'Lilongwe Fire Station',
                'type' => 'fire_station',
                'phone' => '+265 1 751 333',
                'alternative_phone' => '998',
                'email' => null,
                'address' => 'Lilongwe, Malawi',
                'latitude' => -13.9626,
                'longitude' => 33.7741,
                'notes' => 'Fire emergency service - Dial 998',
                'display_order' => 1,
            ],
            [
                'name' => 'Blantyre Fire Station',
                'type' => 'fire_station',
                'phone' => '+265 1 820 333',
                'alternative_phone' => '998',
                'email' => null,
                'address' => 'Blantyre, Malawi',
                'latitude' => -15.7861,
                'longitude' => 35.0050,
                'notes' => 'Fire emergency service - Dial 998',
                'display_order' => 2,
            ],

            // Emergency Services
            [
                'name' => 'Police Emergency',
                'type' => 'emergency',
                'phone' => '997',
                'alternative_phone' => '+265 1 751 333',
                'email' => null,
                'address' => 'Nationwide',
                'latitude' => null,
                'longitude' => null,
                'notes' => 'Dial 997 for police emergencies - Available 24/7',
                'display_order' => 1,
            ],
            [
                'name' => 'Fire Emergency',
                'type' => 'emergency',
                'phone' => '998',
                'alternative_phone' => null,
                'email' => null,
                'address' => 'Nationwide',
                'latitude' => null,
                'longitude' => null,
                'notes' => 'Dial 998 for fire emergencies - Available 24/7',
                'display_order' => 2,
            ],
            [
                'name' => 'Medical Emergency',
                'type' => 'emergency',
                'phone' => '997',
                'alternative_phone' => null,
                'email' => null,
                'address' => 'Nationwide',
                'latitude' => null,
                'longitude' => null,
                'notes' => 'Dial 997 for medical emergencies - Available 24/7',
                'display_order' => 3,
            ],

            // Utility Services
            [
                'name' => 'ESCOM (Electricity)',
                'type' => 'utility',
                'phone' => '+265 1 820 000',
                'alternative_phone' => null,
                'email' => 'info@escom.mw',
                'address' => 'Blantyre, Malawi',
                'latitude' => null,
                'longitude' => null,
                'notes' => 'Electricity Supply Corporation of Malawi - Power emergencies',
                'display_order' => 1,
            ],
            [
                'name' => 'Water Board',
                'type' => 'utility',
                'phone' => '+265 1 751 000',
                'alternative_phone' => null,
                'email' => null,
                'address' => 'Lilongwe, Malawi',
                'latitude' => null,
                'longitude' => null,
                'notes' => 'Water supply emergencies and issues',
                'display_order' => 2,
            ],
        ];

        foreach ($contacts as $contact) {
            EmergencyContact::create($contact);
        }
    }
}
