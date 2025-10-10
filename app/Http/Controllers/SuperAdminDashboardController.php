<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Traits\ManagesQRCodes;

class SuperAdminDashboardController extends Controller
{
    use ManagesQRCodes;

    public function index()
    {
        return Inertia::render('SuperAdmin/Dashboard', array_merge([
            'systemStats' => $this->getSystemStats(),
            // Other existing data...
        ], $this->getQRCodeData()));
    }

    private function getSystemStats()
    {
        // Your existing system stats logic
        return [];
    }
}