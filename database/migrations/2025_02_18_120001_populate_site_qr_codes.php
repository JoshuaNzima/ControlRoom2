<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use App\Models\Guards\ClientSite;

return new class extends Migration
{
    public function up(): void
    {
        // Generate unique QR codes for all existing sites that don't have one
        $sites = DB::table('client_sites')
            ->whereNull('qr_code')
            ->get(['id']);

        foreach ($sites as $site) {
            $qrCode = ClientSite::generateUniqueQrCode();
            DB::table('client_sites')
                ->where('id', $site->id)
                ->update(['qr_code' => $qrCode]);
        }
    }

    public function down(): void
    {
        // No need to rollback QR codes
    }
};
