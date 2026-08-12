<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MarketingCampaign;
use Illuminate\Http\Request;

class MarketingCampaignController extends Controller
{
    public function index()
    {
        return redirect()->route('admin.marketing');
    }

    public function store(Request $request)
    {
        $validated = $this->validateData($request);

        MarketingCampaign::create($validated);

        return redirect()->route('admin.marketing')
            ->withSuccess('Campaign created successfully.');
    }

    public function update(Request $request, MarketingCampaign $campaign)
    {
        $validated = $this->validateData($request);

        $campaign->update($validated);

        return redirect()->route('admin.marketing')
            ->withSuccess('Campaign updated successfully.');
    }

    public function destroy(MarketingCampaign $campaign)
    {
        $campaign->delete();

        return redirect()->route('admin.marketing')
            ->withSuccess('Campaign deleted successfully.');
    }

    public function showJson(MarketingCampaign $campaign)
    {
        return response()->json($campaign);
    }

    protected function validateData(Request $request): array
    {
        $channels = MarketingCampaign::CHANNELS;
        $statuses = MarketingCampaign::STATUSES;

        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'channel' => ['nullable', 'string', 'max:100'],
            'budget' => ['nullable', 'numeric', 'min:0'],
            'status' => ['required', 'string', 'in:' . implode(',', $statuses)],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'target_audience' => ['nullable', 'string', 'max:255'],
            'objective' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
        ]);
    }
}
