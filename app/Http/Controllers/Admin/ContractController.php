<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Contract;
use App\Models\Client;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ContractController extends Controller
{
    public function index()
    {
        $status = request('status');
        $search = request('search');

        $query = Contract::with('client');

        if ($status) $query->where('status', $status);
        if ($search) $query->where(function($q) use ($search) {
            $q->where('title', 'like', "%{$search}%")
              ->orWhereHas('client', function($cq) use ($search){
                  $cq->where('name', 'like', "%{$search}%");
              });
        });

        $contracts = $query->orderByDesc('created_at')->paginate(15)->through(function($c){
            return [
                'id' => $c->id,
                'client_name' => $c->client?->name,
                'title' => $c->title,
                'value' => $c->value,
                'status' => $c->status,
                'start_date' => optional($c->start_date)->toDateString(),
                'end_date' => optional($c->end_date)->toDateString(),
                'renewal_date' => optional($c->renewal_date)->toDateString(),
            ];
        });

        $summary = [
            'total' => Contract::count(),
            'active' => Contract::where('status', 'active')->count(),
            'expired' => Contract::where('status', 'expired')->count(),
            'draft' => Contract::where('status', 'draft')->count(),
        ];

        $clients = Client::orderBy('name')->get(['id','name']);

        $user = auth()->user();

        return Inertia::render('Admin/BusinessDevContracts', [
            'contracts' => $contracts,
            'filters' => [
                'status' => $status,
                'search' => $search,
            ],
            'summary' => $summary,
            'clients' => $clients,
            'statuses' => ['draft','active','expired','terminated'],
            'auth' => [
                'user' => [
                    'name' => $user?->name,
                ],
            ],
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);
        Contract::create($data);
        return redirect()->route('admin.business-dev.contracts.index');
    }

    public function update(Request $request, Contract $contract)
    {
        $data = $this->validateData($request);
        $contract->update($data);
        return redirect()->route('admin.business-dev.contracts.index');
    }

    public function destroy(Contract $contract)
    {
        $contract->delete();
        return redirect()->route('admin.business-dev.contracts.index');
    }

    public function showJson(Contract $contract)
    {
        return response()->json($contract->load('client:id,name'));
    }

    protected function validateData(Request $request): array
    {
        return $request->validate([
            'client_id' => ['required','integer','exists:clients,id'],
            'title' => ['required','string','max:255'],
            'start_date' => ['nullable','date'],
            'end_date' => ['nullable','date','after_or_equal:start_date'],
            'value' => ['nullable','numeric','min:0'],
            'status' => ['required','string','max:50'],
            'renewal_date' => ['nullable','date'],
            'contact_person' => ['nullable','string','max:255'],
            'contact_email' => ['nullable','email','max:255'],
            'terms' => ['nullable','string'],
        ]);
    }
}
