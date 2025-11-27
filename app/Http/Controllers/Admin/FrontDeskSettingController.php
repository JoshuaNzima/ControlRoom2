<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FrontDeskSettingController extends Controller
{
    public function index()
    {
        $defaults = [
            'visitor_badge_prefix' => 'VIS',
            'auto_notify_security' => false,
            'working_hours' => '08:00-17:00',
            'default_ticket_priority' => 'normal',
        ];

        $row = Setting::where('key', 'front_desk.settings')->first();
        $settings = $row && is_array($row->value) ? array_merge($defaults, $row->value) : $defaults;

        $user = auth()->user();

        return Inertia::render('Admin/FrontDeskSettings', [
            'settings' => $settings,
            'options' => [
                'priorities' => ['low','normal','high','urgent'],
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
            'visitor_badge_prefix' => ['required','string','max:10'],
            'auto_notify_security' => ['required','boolean'],
            'working_hours' => ['required','string','max:25'],
            'default_ticket_priority' => ['required','in:low,normal,high,urgent'],
        ]);

        $row = Setting::firstOrNew(['key' => 'front_desk.settings']);
        $row->module = 'front_desk';
        $row->value = $data;
        $row->save();

        return redirect()->route('admin.front-desk.settings');
    }
}
