<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class AttendanceSettingsController extends Controller
{
    public function update(Request $request)
    {
        $data = $request->validate([
            'auto_absent' => ['required', 'boolean'],
            'auto_present' => ['required', 'boolean'],
        ]);

        Setting::setValue('attendance.methods', [
            'auto_absent' => (bool) $data['auto_absent'],
            'auto_present' => (bool) $data['auto_present'],
        ], 'attendance');

        return back()->with('success', 'Attendance methods updated.');
    }
}
