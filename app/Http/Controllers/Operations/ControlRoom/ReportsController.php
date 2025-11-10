<?php

namespace App\Http\Controllers\Operations\ControlRoom;

use App\Http\Controllers\Controller;
use Inertia\Inertia;

class ReportsController extends Controller
{
	public function index()
	{
		return Inertia::render('ControlRoom/Reports/Index');
	}
}
