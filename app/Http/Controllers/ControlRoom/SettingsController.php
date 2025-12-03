<?php

namespace App\Http\Controllers\ControlRoom;

use App\Http\Controllers\Controller;
use App\Models\ControlRoomSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class SettingsController extends Controller
{
    public function index(Request $request)
    {
        $userId = Auth::id();

        $defaults = [
            'monitor.map.showCountsOverlay' => true,
            'monitor.map.scaleByRequired' => true,
        ];

        $settings = ControlRoomSetting::query()
            ->where('user_id', $userId)
            ->whereIn('key', array_keys($defaults))
            ->get()
            ->pluck('value', 'key')
            ->toArray();

        $mapped = [
            'showCountsOverlay' => (bool)($settings['monitor.map.showCountsOverlay'] ?? $defaults['monitor.map.showCountsOverlay']),
            'scaleByRequired' => (bool)($settings['monitor.map.scaleByRequired'] ?? $defaults['monitor.map.scaleByRequired']),
        ];

        return Inertia::render('ControlRoom/Settings', [
            'settings' => $mapped,
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'showCountsOverlay' => ['required','boolean'],
            'scaleByRequired' => ['required','boolean'],
        ]);

        $userId = Auth::id();

        ControlRoomSetting::updateOrCreate(
            ['user_id' => $userId, 'key' => 'monitor.map.showCountsOverlay'],
            ['value' => (bool)$data['showCountsOverlay']]
        );
        ControlRoomSetting::updateOrCreate(
            ['user_id' => $userId, 'key' => 'monitor.map.scaleByRequired'],
            ['value' => (bool)$data['scaleByRequired']]
        );

        return back()->with('success', 'Settings saved.');
    }
}
