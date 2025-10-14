<?php

namespace App\Http\Controllers\ControlRoom;

use App\Http\Controllers\Controller;
use App\Models\Guards\Client;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ClientsController extends Controller
{
	public function index()
	{
		$clients = Client::withCount('sites')
			->when(request('search'), function($q, $search) {
				$q->where('name', 'like', "%{$search}%");
			})
			->orderBy('name')
			->paginate(20);

		return Inertia::render('ControlRoom/Clients/Index', [
			'clients' => $clients,
			'filters' => request()->only(['search']),
		]);
	}
}
