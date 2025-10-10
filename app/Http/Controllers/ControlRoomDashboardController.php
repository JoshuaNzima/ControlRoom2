<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Traits\ManagesQRCodes;

class ControlRoomDashboardController extends Controller
{
    use ManagesQRCodes;

    public function index()
    {
        return Inertia::render('ControlRoom/Dashboard', array_merge([
            'metrics' => $this->getMetrics(),
            'activeIncidents' => $this->getActiveIncidents(),
            // Other existing data...
        ], $this->getQRCodeData()));
    }

    private function getMetrics()
    {
        // Your existing metrics logic
        return [];
    }

    private function getActiveIncidents()
    {
        // Your existing incidents logic
        return [];
    }
}