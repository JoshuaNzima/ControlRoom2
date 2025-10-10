<?php

namespace App\Http\Controllers\Guards;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class SergeantController extends Controller
{
      public function index()
    {
        return Inertia::render('Guards/Sergeants', [
            'message' => 'Sergeants page - Coming soon',
        ]);
    }
}
