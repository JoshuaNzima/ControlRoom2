<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function index()
    {
        return Inertia::render('Reports/Index', [
            'message' => 'Reports page - Coming soon',
        ]);
    }
}
