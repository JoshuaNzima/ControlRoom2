<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ArchivedController extends Controller
{
    public function index()
    {
        return Inertia::render('HR/Archived', [
            'message' => 'Archived Guards page - Coming soon',
        ]);
    }
}
