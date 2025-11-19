<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LeaveController extends Controller
{
     public function index()
    {
        return Inertia::render('HR/Leaves', [
            'message' => 'Leave Management page - Coming soon',
        ]);
    }
}
