<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\PayProfile;
use Illuminate\Http\Request;

class FinanceSettingController extends Controller
{
    public function updatePayrollDefaults(Request $request)
    {
        $data = $request->validate([
            'guard_absence_deduction_per_day' => 'required|numeric|min:0',
            'staff_absence_deduction_per_day' => 'required|numeric|min:0',
            'overtime_multiplier_default' => 'required|numeric|min:1',
        ]);

        Setting::updateOrCreate(
            ['key' => 'finance.payroll.defaults'],
            ['module' => 'finance', 'value' => $data]
        );

        return back()->with('success', 'Payroll defaults updated.');
    }

    public function storePayProfile(Request $request)
    {
        $data = $request->validate([
            'payee_type' => 'required|in:guard,user',
            'payee_id' => 'required|integer',
            'monthly_salary' => 'required|numeric|min:0',
            'overtime_multiplier' => 'nullable|numeric|min:1',
            'advance_amount' => 'nullable|numeric|min:0',
            'allowances' => 'nullable', // json
            'absence_deduction_per_day' => 'nullable|numeric|min:0',
        ]);

        // decode allowances if passed as JSON string
        if (isset($data['allowances']) && is_string($data['allowances'])) {
            $decoded = json_decode($data['allowances'], true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $data['allowances'] = $decoded;
            } else {
                unset($data['allowances']);
            }
        }

        $profile = PayProfile::create($data);
        return back()->with('success', 'Pay profile created.');
    }

    public function updatePayProfile(PayProfile $payProfile, Request $request)
    {
        $data = $request->validate([
            'monthly_salary' => 'required|numeric|min:0',
            'overtime_multiplier' => 'nullable|numeric|min:1',
            'advance_amount' => 'nullable|numeric|min:0',
            'allowances' => 'nullable',
            'absence_deduction_per_day' => 'nullable|numeric|min:0',
        ]);

        if (isset($data['allowances']) && is_string($data['allowances'])) {
            $decoded = json_decode($data['allowances'], true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $data['allowances'] = $decoded;
            } else {
                unset($data['allowances']);
            }
        }

        $payProfile->update($data);
        return back()->with('success', 'Pay profile updated.');
    }

    public function destroyPayProfile(PayProfile $payProfile)
    {
        $payProfile->delete();
        return back()->with('success', 'Pay profile removed.');
    }
}
