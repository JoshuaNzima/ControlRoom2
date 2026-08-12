<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\HR\Employee;
use Illuminate\Validation\Rule;
use App\Models\Guards\Guard;
use App\Models\Zone;
use App\Models\User;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

class EmployeeController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 20);
        $query = Guard::query()
            ->when($request->input('search'), function ($q, $search) {
                $q->where(function($qq) use ($search) {
                    $qq->where('name', 'like', "%{$search}%")
                       ->orWhere('email', 'like', "%{$search}%")
                       ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->when($request->input('status'), function ($q, $status) {
                $q->where('status', $status);
            })
            ->when($request->input('employee_role'), function ($q, $role) {
                if (in_array($role, ['guard','driver'])) {
                    $q->where('employee_role', $role);
                }
            })
            ->orderBy('name');

        $guards = $query->paginate($perPage)->withQueryString();

        $zones = Zone::select(['id','name'])->orderBy('name')->get();

        return Inertia::render('HR/Employees', [
            'guards' => $guards,
            'filters' => $request->only(['search', 'status', 'employee_role', 'per_page']),
            'zones' => $zones,
        ]);
    }

    public function promote(Request $request, Guard $guard)
    {
        $validated = $request->validate([
            'role' => ['required', Rule::in(['sergeant','supervisor','zone_commander'])],
            'zone_id' => ['nullable', 'required_if:role,zone_commander', 'integer', 'exists:zones,id'],
        ]);

        // Generate unique email if guard doesn't have one
        $email = $guard->email;
        if (!$email) {
            $email = 'guard.' . $guard->id . '@coinsecurity.local';
        }

        $user = User::where('email', $email)->first();
        $isNew = false;
        if (!$user) {
            $user = new User();
            $user->name = $guard->name;
            $user->email = $email;
            $user->phone = $guard->phone;
            if (!empty($validated['zone_id'])) {
                $user->zone_id = $validated['zone_id'];
            }
            $tempPassword = Str::random(12);
            $user->password = $tempPassword;
            $user->status = 'active';
            $user->save();
            $isNew = true;
        } else {
            if (!empty($validated['zone_id'])) {
                $user->zone_id = $validated['zone_id'];
                $user->save();
            }
        }

        Role::findOrCreate($validated['role'], 'web');
        $user->assignRole($validated['role']);

        return back()->with('success', 'Guard promoted to ' . str_replace('_', ' ', $validated['role']) . ($isNew ? ' and login created.' : '.'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:employees,email'],
            'phone' => ['nullable', 'string', 'max:50'],
            'position' => ['nullable', 'string', 'max:255'],
            'department' => ['nullable', 'string', 'max:255'],
            'status' => ['required', Rule::in(['active','inactive','terminated'])],
            'hired_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
        ]);

        Employee::create($validated);

        return back()->with('success', 'Employee created successfully.');
    }

    public function update(Request $request, Employee $employee)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('employees', 'email')->ignore($employee->id)],
            'phone' => ['nullable', 'string', 'max:50'],
            'position' => ['nullable', 'string', 'max:255'],
            'department' => ['nullable', 'string', 'max:255'],
            'status' => ['required', Rule::in(['active','inactive','terminated'])],
            'hired_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
        ]);

        $employee->update($validated);

        return back()->with('success', 'Employee updated successfully.');
    }

    public function destroy(Employee $employee)
    {
        $employee->delete();
        return back()->with('success', 'Employee removed successfully.');
    }
}
