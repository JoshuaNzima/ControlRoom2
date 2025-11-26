<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\MarketingCampaign;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LeadController extends Controller
{
    public function index()
    {
        $statuses = ['new', 'contacted', 'qualified', 'converted', 'lost'];
        $sources = ['referral', 'website', 'email', 'call', 'event', 'other'];

        $query = Lead::query()->with(['assignedUser:id,name', 'campaign:id,name']);
        $status = request('status');
        $source = request('source');
        $search = request('search');

        if ($status) $query->where('status', $status);
        if ($source) $query->where('source', $source);
        if ($search) $query->where(function($q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
              ->orWhere('email', 'like', "%{$search}%")
              ->orWhere('phone', 'like', "%{$search}%");
        });

        $leads = $query->orderByDesc('created_at')->paginate(15)->through(function($lead){
            return [
                'id' => $lead->id,
                'name' => $lead->name,
                'email' => $lead->email,
                'phone' => $lead->phone,
                'source' => $lead->source,
                'status' => $lead->status,
                'score' => $lead->score,
                'assigned' => $lead->assignedUser?->name,
                'campaign' => $lead->campaign?->name,
                'created_at' => optional($lead->created_at)->toDateTimeString(),
            ];
        });

        $summary = [
            'total' => Lead::count(),
            'new' => Lead::where('status', 'new')->count(),
            'contacted' => Lead::where('status', 'contacted')->count(),
            'qualified' => Lead::where('status', 'qualified')->count(),
            'converted' => Lead::where('status', 'converted')->count(),
        ];

        $campaigns = MarketingCampaign::orderBy('name')->get(['id','name']);

        $user = auth()->user();

        return Inertia::render('Admin/MarketingLeads', [
            'leads' => $leads,
            'filters' => [
                'status' => $status,
                'source' => $source,
                'search' => $search,
            ],
            'summary' => $summary,
            'statuses' => $statuses,
            'sources' => $sources,
            'campaigns' => $campaigns,
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
        Lead::create($data);
        return redirect()->route('admin.marketing.leads.index');
    }

    public function update(Request $request, Lead $lead)
    {
        $data = $this->validateData($request);
        $lead->update($data);
        return redirect()->route('admin.marketing.leads.index');
    }

    public function destroy(Lead $lead)
    {
        $lead->delete();
        return redirect()->route('admin.marketing.leads.index');
    }

    public function showJson(Lead $lead)
    {
        return response()->json($lead->load(['assignedUser:id,name','campaign:id,name']));
    }

    protected function validateData(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:100'],
            'source' => ['nullable', 'string', 'max:100'],
            'status' => ['required', 'string', 'max:100'],
            'score' => ['nullable', 'integer', 'min:0', 'max:100'],
            'assigned_to' => ['nullable', 'integer', 'exists:users,id'],
            'campaign_id' => ['nullable', 'integer', 'exists:marketing_campaigns,id'],
            'notes' => ['nullable', 'string'],
        ]);
    }
}
