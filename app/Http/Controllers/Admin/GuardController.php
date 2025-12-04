<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Guards\Guard;
use App\Models\Guards\GuardAssignment;
use App\Models\Guards\ClientSite;
use App\Models\Guards\Client;
use App\Models\Guards\GuardGrade;
use App\Models\Zone;
use App\Models\PayProfile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
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

        $user = auth()->user();
        $canAssignSupervisor = $user ? $user->can('assign_guard_supervisor') : false;
        $canViewSupervisor = true; // allow view by default
        $supervisors = [];
        if ($canAssignSupervisor) {
            $supervisors = User::role(['supervisor', 'manager'])
                ->where('status', 'active')
                ->orderBy('name')
                ->get(['id','name']);
        }
        $grades = GuardGrade::orderBy('name')->get(['id','code','name']);
        $zones = Zone::orderBy('name')->get(['id','name']);

        return Inertia::render('Admin/Guards/Index', [
            'guards' => $guards,
            'filters' => request()->only(['search', 'status']),
            'canAssignSupervisor' => $canAssignSupervisor,
            'canViewSupervisor' => $canViewSupervisor,
            'supervisors' => $supervisors,
            'grades' => $grades,
            'zones' => $zones,
        ]);
    }

    public function create()
    {
        $this->authorize('create', Guard::class);
        
        $canAssignSupervisor = auth()->user()->can('assign_guard_supervisor');
        $supervisors = [];
        $grades = GuardGrade::orderBy('name')->get(['id','code','name']);
        
        if ($canAssignSupervisor) {
            $supervisors = User::role(['supervisor', 'manager'])
                ->where('status', 'active')
                ->orderBy('name')
                ->get();
        }

        $clients = Client::orderBy('name')->get(['id','name']);

        return Inertia::render('Admin/Guards/Create', [
            'supervisors' => $supervisors,
            'clients' => $clients,
            'grades' => $grades,
            'can' => [
                'assign_supervisor' => $canAssignSupervisor,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'nullable|string|unique:guards,employee_id',
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|unique:guards,email',
            'address' => 'nullable|string',
            'residence_address' => 'nullable|string',
            'residence_city' => 'nullable|string',
            'residence_district' => 'nullable|string',
            'id_number' => 'nullable|string|unique:guards,id_number',
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|in:male,female,other',
            'marital_status' => 'nullable|in:single,married,divorced,widowed',
            'spouse_name' => 'nullable|string|max:255',
            'spouse_phone' => 'nullable|string|max:50',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:20',
            'next_of_kin_name' => 'nullable|string|max:255',
            'next_of_kin_relationship' => 'nullable|string|max:100',
            'next_of_kin_phone' => 'nullable|string|max:50',
            'supervisor_id' => 'nullable|exists:users,id',
            'hire_date' => 'nullable|date',
            'guard_type' => 'nullable|in:permanent,standby,reliever',
            'guard_grade_id' => 'nullable|exists:guard_grades,id',
            'home_village' => 'nullable|string|max:255',
            'home_ta' => 'nullable|string|max:255',
            'home_district' => 'nullable|string|max:255',
            'education_level' => 'nullable|string|max:255',
            'qualifications' => 'nullable|array',
            'languages' => 'nullable|array',
            'dependents_count' => 'nullable|integer|min:0',
            'children_names' => 'nullable|string',
            'notes' => 'nullable|string',
            'status' => 'required|in:active,inactive,suspended',
            'employee_role' => 'nullable|in:guard,driver',
            'photo' => 'nullable|image|max:5120',
            // Optional quick assignment by client only
            'client_id' => 'nullable|exists:clients,id',
        ]);

        if (!auth()->user()->can('assign_guard_supervisor')) {
            unset($validated['supervisor_id']);
        }

        if ($request->hasFile('photo')) {
            $validated['photo'] = $request->file('photo')->store('guards', 'public');
        }
        if (empty($validated['employee_id'])) {
            $validated['employee_id'] = $this->generateGuardEmployeeId();
        }

        $guard = Guard::create($validated);

        // If a grade is provided, ensure a default PayProfile exists for this guard
        if (!empty($validated['guard_grade_id'])) {
            $grade = GuardGrade::find($validated['guard_grade_id']);
            if ($grade) {
                PayProfile::firstOrCreate(
                    ['payee_type' => 'guard', 'payee_id' => $guard->id],
                    [
                        'monthly_salary' => $grade->base_salary ?? 0,
                        'overtime_multiplier' => $grade->overtime_multiplier ?? 1.5,
                        'allowances' => $grade->allowances ?? [],
                        'absence_deduction_per_day' => $grade->absence_deduction_per_day ?? null,
                    ]
                );
            }
        }

        // Optional quick assignment by client: pick first active site
        if ($request->filled('client_id')) {
            $site = ClientSite::where('client_id', $request->input('client_id'))
                ->orderBy('id')
                ->first();
            if ($site) {
                GuardAssignment::create([
                    'guard_id' => $guard->id,
                    'client_site_id' => $site->id,
                    'assigned_by' => auth()->id(),
                    'start_date' => now()->toDateString(),
                    'end_date' => null,
                    'assignment_type' => 'primary',
                    'notes' => null,
                    'is_active' => true,
                ]);
            }
        }

        return redirect()->route('admin.guards.index')
            ->withSuccess('Guard created successfully.');
    }

    private function generateGuardEmployeeId(): string
    {
        do {
            $candidate = 'G-'.now()->format('ym').'-'.sprintf('%04d', random_int(0, 9999));
        } while (Guard::where('employee_id', $candidate)->exists());
        return $candidate;
    }

    public function edit(Guard $guard)
    {
        $this->authorize('update', $guard);
        
        $canAssignSupervisor = auth()->user()->can('assign_guard_supervisor');
        $supervisors = [];
        $grades = GuardGrade::orderBy('name')->get(['id','code','name']);
        
        if ($canAssignSupervisor) {
            $supervisors = User::role(['supervisor', 'manager'])
                ->where('status', 'active')
                ->orderBy('name')
                ->get();
        }

        return Inertia::render('Admin/Guards/Edit', [
            'guard' => $guard->load('supervisor'),
            'supervisors' => $supervisors,
            'grades' => $grades,
            'can' => [
                'assign_supervisor' => $canAssignSupervisor,
            ],
        ]);
    }

    public function update(Request $request, Guard $guard)
    {
        $this->authorize('update', $guard);
        
        $rules = [
            'employee_id' => 'nullable|string|unique:guards,employee_id,' . $guard->id,
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|unique:guards,email,' . $guard->id,
            'address' => 'nullable|string',
            'residence_address' => 'nullable|string',
            'residence_city' => 'nullable|string',
            'residence_district' => 'nullable|string',
            'id_number' => 'nullable|string|unique:guards,id_number,' . $guard->id,
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|in:male,female,other',
            'marital_status' => 'nullable|in:single,married,divorced,widowed',
            'spouse_name' => 'nullable|string|max:255',
            'spouse_phone' => 'nullable|string|max:50',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:20',
            'next_of_kin_name' => 'nullable|string|max:255',
            'next_of_kin_relationship' => 'nullable|string|max:100',
            'next_of_kin_phone' => 'nullable|string|max:50',
            'supervisor_id' => 'nullable|exists:users,id',
            'hire_date' => 'nullable|date',
            'guard_type' => 'nullable|in:permanent,standby,reliever',
            'guard_grade_id' => 'nullable|exists:guard_grades,id',
            'home_village' => 'nullable|string|max:255',
            'home_ta' => 'nullable|string|max:255',
            'home_district' => 'nullable|string|max:255',
            'education_level' => 'nullable|string|max:255',
            'qualifications' => 'nullable|array',
            'languages' => 'nullable|array',
            'dependents_count' => 'nullable|integer|min:0',
            'children_names' => 'nullable|string',
            'notes' => 'nullable|string',
            'status' => 'required|in:active,inactive,suspended',
            'employee_role' => 'nullable|in:guard,driver',
            'photo' => 'nullable|image|max:5120',
        ];

        $validated = $request->validate($rules);
        
        if ($request->hasFile('photo')) {
            if ($guard->photo) {
                Storage::disk('public')->delete($guard->photo);
            }
            $validated['photo'] = $request->file('photo')->store('guards', 'public');
        }
        
        if (!auth()->user()->can('assign_guard_supervisor')) {
            unset($validated['supervisor_id']);
        }
        
        $guard->update($validated);

        // If a grade is set and guard has no pay profile, seed defaults
        if (!empty($validated['guard_grade_id'])) {
            $hasProfile = PayProfile::where('payee_type', 'guard')->where('payee_id', $guard->id)->exists();
            if (!$hasProfile) {
                $grade = GuardGrade::find($validated['guard_grade_id']);
                if ($grade) {
                    PayProfile::create([
                        'payee_type' => 'guard',
                        'payee_id' => $guard->id,
                        'monthly_salary' => $grade->base_salary ?? 0,
                        'overtime_multiplier' => $grade->overtime_multiplier ?? 1.5,
                        'allowances' => $grade->allowances ?? [],
                        'absence_deduction_per_day' => $grade->absence_deduction_per_day ?? null,
                    ]);
                }
            }
        }

        return redirect()->route('admin.guards.index')
            ->withSuccess('Guard updated successfully.');
    }

    public function apiShow(Guard $guard)
    {
        $guard->load(['supervisor']);
        return response()->json($guard);
    }

    public function destroy(Guard $guard)
    {
        $guard->delete();

        return redirect()->route('admin.guards.index')
            ->withSuccess('Guard deleted successfully.');
    }
}