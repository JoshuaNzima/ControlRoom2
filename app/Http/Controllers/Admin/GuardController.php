<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Guards\Guard;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GuardController extends Controller
{
    public function dashboard()
    {
        $total = Guard::count();
        $active = Guard::where('status', 'active')->count();
        $inactive = Guard::where('status', 'inactive')->count();
        $suspended = Guard::where('status', 'suspended')->count();

        $recent = Guard::latest()->limit(5)->get(['id', 'name', 'employee_id', 'status']);

        return Inertia::render('Admin/Guards/Dashboard', [
            'kpis' => [
                'total_guards' => $total,
                'active_guards' => $active,
                'inactive_guards' => $inactive,
                'suspended_guards' => $suspended,
            ],
            'recentGuards' => $recent,
        ]);
    }
    public function index()
    {
        $guards = Guard::with('supervisor')
            ->when(request('search'), function($q, $search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('employee_id', 'like', "%{$search}%");
            })
            ->when(request('status'), function($q, $status) {
                $q->where('status', $status);
            })
            ->orderBy('name')
            ->paginate(20);

        return Inertia::render('Admin/Guards/Index', [
            'guards' => $guards,
            'filters' => request()->only(['search', 'status']),
        ]);
    }

    public function create()
    {
        $this->authorize('create', Guard::class);
        
        $canAssignSupervisor = auth()->user()->can('assign_guard_supervisor');
        $supervisors = [];
        
        if ($canAssignSupervisor) {
            $supervisors = User::role(['supervisor', 'manager'])
                ->where('status', 'active')
                ->orderBy('name')
                ->get();
        }

        return Inertia::render('Admin/Guards/Create', [
            'supervisors' => $supervisors,
            'can' => [
                'assign_supervisor' => $canAssignSupervisor,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|string|unique:guards,employee_id',
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|unique:guards,email',
            'address' => 'nullable|string',
            'id_number' => 'nullable|string|unique:guards,id_number',
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|in:male,female,other',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:20',
            'supervisor_id' => 'nullable|exists:users,id',
            'hire_date' => 'required|date',
            'notes' => 'nullable|string',
            'status' => 'required|in:active,inactive,suspended',
            'photo' => 'nullable|image|max:5120',
        ]);

        if (!auth()->user()->can('assign_guard_supervisor')) {
            unset($validated['supervisor_id']);
        }

        if ($request->hasFile('photo')) {
            $validated['photo'] = $request->file('photo')->store('guards', 'public');
        }

        Guard::create($validated);

        return redirect()->route('guards.index')
            ->with('success', 'Guard created successfully.');
    }

    public function edit(Guard $guard)
    {
        $this->authorize('update', $guard);
        
        $canAssignSupervisor = auth()->user()->can('assign_guard_supervisor');
        $supervisors = [];
        
        if ($canAssignSupervisor) {
            $supervisors = User::role(['supervisor', 'manager'])
                ->where('status', 'active')
                ->orderBy('name')
                ->get();
        }

        return Inertia::render('Admin/Guards/Edit', [
            'guard' => $guard->load('supervisor'),
            'supervisors' => $supervisors,
            'can' => [
                'assign_supervisor' => $canAssignSupervisor,
            ],
        ]);
    }

    public function update(Request $request, Guard $guard)
    {
        $this->authorize('update', $guard);
        
        $rules = [
            'employee_id' => 'required|string|unique:guards,employee_id,' . $guard->id,
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|unique:guards,email,' . $guard->id,
            'address' => 'nullable|string',
            'id_number' => 'nullable|string|unique:guards,id_number,' . $guard->id,
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|in:male,female,other',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:20',
            'supervisor_id' => 'nullable|exists:users,id',
            'hire_date' => 'required|date',
            'notes' => 'nullable|string',
            'status' => 'required|in:active,inactive,suspended',
        ]);

        $validated = $request->validate($rules);
        
        if (!auth()->user()->can('assign_guard_supervisor')) {
            unset($validated['supervisor_id']);
        }
        
        $guard->update($validated);

        return redirect()->route('guards.index')
            ->with('success', 'Guard updated successfully.');
    }

    public function destroy(Guard $guard)
    {
        $guard->delete();

        return redirect()->route('guards.index')
            ->with('success', 'Guard deleted successfully.');
    }
}