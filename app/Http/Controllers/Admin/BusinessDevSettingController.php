<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\ClientEvent;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BusinessDevSettingController extends Controller
{
    public function index()
    {
        $defaults = [
            'default_event_status' => 'planned',
            'default_billing_type' => 'per_event',
            'k9_default_units' => 0,
            'invoice_tax_percentage' => 0,
            'invoice_due_days' => 30,
        ];

        $row = Setting::where('key', 'business_dev.settings')->first();
        $settings = $row && is_array($row->value) ? array_merge($defaults, $row->value) : $defaults;

        $user = auth()->user();

        return Inertia::render('Admin/BusinessDevSettings', [
            'settings' => $settings,
            'options' => [
                'statuses' => ClientEvent::STATUSES,
                'billing_types' => ClientEvent::BILLING_TYPES,
            ],
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
            'default_event_status' => ['required','string','max:50'],
            'default_billing_type' => ['required','string','max:50'],
            'k9_default_units' => ['required','integer','min:0'],
            'invoice_tax_percentage' => ['required','numeric','min:0','max:100'],
            'invoice_due_days' => ['required','integer','min:1','max:120'],
        ]);

        $row = Setting::firstOrNew(['key' => 'business_dev.settings']);
        $row->module = 'business_dev';
        $row->value = $data;
        $row->save();

        return redirect()->route('admin.business-dev.settings');
    }
}
