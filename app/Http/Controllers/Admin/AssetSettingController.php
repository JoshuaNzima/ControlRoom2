<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AssetSettingController extends Controller
{
    public function index()
    {
        $defaults = [
            'asset_tag_prefix' => 'AST',
            'vehicle_tag_prefix' => 'VEH',
            'service_interval_days' => 90,
            'require_checkout_confirmation' => false,
        ];

        $row = Setting::where('key', 'assets.settings')->first();
        $settings = $row && is_array($row->value) ? array_merge($defaults, $row->value) : $defaults;

        $user = auth()->user();

        return Inertia::render('Admin/AssetSettings', [
            'settings' => $settings,
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
            'asset_tag_prefix' => ['required','string','max:10'],
            'vehicle_tag_prefix' => ['required','string','max:10'],
            'service_interval_days' => ['required','integer','min:0','max:3650'],
            'require_checkout_confirmation' => ['required','boolean'],
        ]);

        $row = Setting::firstOrNew(['key' => 'assets.settings']);
        $row->module = 'assets';
        $row->value = $data;
        $row->save();

        return redirect()->route('assets.settings');
    }
}
