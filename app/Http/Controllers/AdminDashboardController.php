<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Traits\ManagesQRCodes;

class AdminDashboardController extends Controller
{
    use ManagesQRCodes;

    public function index()
    {
        return Inertia::render('Admin/Dashboard', array_merge([
            'stats' => $this->getStats(),
            // Other existing data...
        ], $this->getQRCodeData()));
    }

    private function getStats()
    {
        // Your existing stats logic
        return [];
    }
}