<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\MarketingCampaign;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MarketingSettingController extends Controller
{
    public function index()
    {
        $defaults = [
            'campaign_default_status' => 'planned',
            'notify_on_new_lead' => false,
            'auto_assign_user_id' => null,
            'lead_sources' => ['referral','website','email','call','event','other'],
        ];

        $row = Setting::where('key', 'marketing.settings')->first();
        $settings = $row && is_array($row->value) ? array_merge($defaults, $row->value) : $defaults;

        $user = auth()->user();

        return Inertia::render('Admin/MarketingSettings', [
            'settings' => $settings,
            'options' => [
                'channels' => MarketingCampaign::CHANNELS,
                'statuses' => MarketingCampaign::STATUSES,
                'lead_sources' => $settings['lead_sources'],
            ],
            'users' => User::orderBy('name')->get(['id','name']),
            'auth' => [
                'user' => [
                    'name' => $user?->name,
                ],
            ],
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'campaign_default_status' => ['required','string','max:50'],
            'notify_on_new_lead' => ['required','boolean'],
            'auto_assign_user_id' => ['nullable','integer','exists:users,id'],
            'lead_sources' => ['nullable','array'],
            'lead_sources.*' => ['string','max:100'],
        ]);

        $row = Setting::firstOrNew(['key' => 'marketing.settings']);
        $row->module = 'marketing';
        $row->value = $data;
        $row->save();

        return redirect()->route('admin.marketing.settings');
    }
}
