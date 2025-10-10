<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    public function index()
    {
        return Inertia::render('Reports/ActivityLogs', [
            'message' => 'Activity Logs page - Coming soon',
        ]);
    }
}
