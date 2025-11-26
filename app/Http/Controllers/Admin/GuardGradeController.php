<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Guards\GuardGrade;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class GuardGradeController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'code' => ['required','string','max:20','unique:guard_grades,code'],
            'name' => ['required','string','max:100'],
            'description' => ['nullable','string'],
            'base_salary' => ['required','numeric','min:0'],
            'overtime_multiplier' => ['nullable','numeric','min:1'],
            'allowances' => ['nullable'],
            'absence_deduction_per_day' => ['nullable','numeric','min:0'],
        ]);

        if (isset($data['allowances']) && is_string($data['allowances'])) {
            $decoded = json_decode($data['allowances'], true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $data['allowances'] = $decoded;
            } else {
                unset($data['allowances']);
            }
        }

        GuardGrade::create($data);
        return back()->with('success', 'Guard grade created.');
    }

    public function update(GuardGrade $guardGrade, Request $request)
    {
        $data = $request->validate([
            'code' => ['required','string','max:20', Rule::unique('guard_grades','code')->ignore($guardGrade->id)],
            'name' => ['required','string','max:100'],
            'description' => ['nullable','string'],
            'base_salary' => ['required','numeric','min:0'],
            'overtime_multiplier' => ['nullable','numeric','min:1'],
            'allowances' => ['nullable'],
            'absence_deduction_per_day' => ['nullable','numeric','min:0'],
        ]);

        if (isset($data['allowances']) && is_string($data['allowances'])) {
            $decoded = json_decode($data['allowances'], true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $data['allowances'] = $decoded;
            } else {
                unset($data['allowances']);
            }
        }

        $guardGrade->update($data);
        return back()->with('success', 'Guard grade updated.');
    }

    public function destroy(GuardGrade $guardGrade)
    {
        $guardGrade->delete();
        return back()->with('success', 'Guard grade deleted.');
    }
}
