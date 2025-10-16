<?php

namespace App\Http\Controllers\ZoneCommander;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SupervisorController extends Controller
{
	public function index()
	{
		return Inertia::render('ZoneCommander/Supervisors');
	}
}


