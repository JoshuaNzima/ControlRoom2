<?php

namespace App\Http\Controllers\Guards;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class OperationsController extends Controller
{
    public function index()
    {
        return Inertia::render('Guards/Operations', [
            'message' => 'Operations page - Coming soon',
        ]);
    }
}
