<?php

namespace App\Http\Controllers\ControlRoom;

use App\Http\Controllers\Controller;
use App\Models\Guards\Guard;
use App\Models\Guards\GuardAssignment;
use App\Models\Guards\ClientSite;
use App\Models\Guards\GuardGrade;
use App\Models\PayProfile;
use App\Models\User;
use Illuminate\Http\Request;

class GuardManageController extends Controller
{
    public function store(Request $request)
    {
        $request->merge([
            'id_number' => ($v = trim((string) $request->input('id_number'))) !== '' ? $v : null,
            'emergency_contact_name' => ($v = trim((string) $request->input('emergency_contact_name'))) !== '' ? $v : null,
            'emergency_contact_phone' => ($v = trim((string) $request->input('emergency_contact_phone'))) !== '' ? $v : null,
        ]);

        $validated = $request->validate([
            'employee_id' => 'nullable|string|unique:guards,employee_id',
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'email' => 'nullable|email|unique:guards,email',
            'address' => 'nullable|string',
            'residence_address' => 'nullable|string',
            'residence_city' => 'nullable|string',
            'residence_district' => 'nullable|string',
            'id_number' => 'nullable|string|unique:guards,id_number',
            'date_of_birth' => 'required|date',
            'gender' => 'required|in:male,female,other',
            'marital_status' => 'nullable|in:single,married,divorced,widowed',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:20',
            'supervisor_id' => 'nullable|exists:users,id',
            'hire_date' => 'nullable|date',
            'guard_type' => 'required|in:permanent,standby,reliever',
            'guard_grade_id' => 'nullable|exists:guard_grades,id',
            'status' => 'required|in:active,inactive,suspended,dismissed,absconded',
            'notes' => 'nullable|string',
            'children_names' => 'nullable|string',
            'photo' => 'nullable|image|max:5120',
            // Optional quick assignment by client site
            'client_site_id' => 'nullable|exists:client_sites,id',
        ]);

        if (empty($validated['hire_date'])) {
            $validated['hire_date'] = now()->toDateString();
        }

        if (!auth()->user()->hasAnyRole(['operations_officer','manager','super_admin'])) {
            unset($validated['supervisor_id']);
        }

        if (empty($validated['employee_id'])) {
            $validated['employee_id'] = $this->generateGuardEmployeeId();
        }

        if ($request->hasFile('photo')) {
            $validated['photo'] = $request->file('photo')->store('guards', 'public');
        }

        $guard = Guard::create($validated);

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

        if (!empty($validated['client_site_id'])) {
            GuardAssignment::create([
                'guard_id' => $guard->id,
                'client_site_id' => $validated['client_site_id'],
                'assigned_by' => auth()->id(),
                'start_date' => now()->toDateString(),
                'end_date' => null,
                'assignment_type' => 'primary',
                'notes' => null,
                'is_active' => true,
            ]);
        }

        return back()->with('success', 'Guard created.');
    }

    public function update(Request $request, Guard $guard)
    {
        $request->merge([
            'id_number' => ($v = trim((string) $request->input('id_number'))) !== '' ? $v : null,
            'emergency_contact_name' => ($v = trim((string) $request->input('emergency_contact_name'))) !== '' ? $v : null,
            'emergency_contact_phone' => ($v = trim((string) $request->input('emergency_contact_phone'))) !== '' ? $v : null,
        ]);

        $validated = $request->validate([
            'employee_id' => 'nullable|string|unique:guards,employee_id,' . $guard->id,
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'email' => 'nullable|email|unique:guards,email,' . $guard->id,
            'address' => 'nullable|string',
            'residence_address' => 'nullable|string',
            'residence_city' => 'nullable|string',
            'residence_district' => 'nullable|string',
            'id_number' => 'nullable|string|unique:guards,id_number,' . $guard->id,
            'date_of_birth' => 'required|date',
            'gender' => 'required|in:male,female,other',
            'marital_status' => 'nullable|in:single,married,divorced,widowed',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:20',
            'supervisor_id' => 'nullable|exists:users,id',
            'hire_date' => 'nullable|date',
            'guard_type' => 'required|in:permanent,standby,reliever',
            'guard_grade_id' => 'nullable|exists:guard_grades,id',
            'status' => 'required|in:active,inactive,suspended,dismissed,absconded',
            'notes' => 'nullable|string',
            'children_names' => 'nullable|string',
            'photo' => 'nullable|image|max:5120',
        ]);

        if (!auth()->user()->hasAnyRole(['operations_officer','manager','super_admin'])) {
            unset($validated['supervisor_id']);
        }

        if ($request->hasFile('photo')) {
            $validated['photo'] = $request->file('photo')->store('guards', 'public');
        }

        $guard->update($validated);

        return back()->with('success', 'Guard updated.');
    }

    public function destroy(Guard $guard)
    {
        $guard->delete();
        return back()->with('success', 'Guard deleted.');
    }

    public function assignSupervisor(Request $request)
    {
        $validated = $request->validate([
            'guard_ids' => 'required|array',
            'guard_ids.*' => 'exists:guards,id',
            'supervisor_id' => 'required|exists:users,id',
        ]);

        $supervisor = User::findOrFail($validated['supervisor_id']);
        if (!$supervisor->hasAnyRole(['supervisor','manager','operations_officer'])) {
            return back()->with('error', 'Selected user is not a supervisor/manager.');
        }

        Guard::whereIn('id', $validated['guard_ids'])
            ->update(['supervisor_id' => $validated['supervisor_id']]);

        return back()->with('success', 'Supervisor assigned.');
    }

    public function unassignSupervisor(Request $request)
    {
        $validated = $request->validate([
            'guard_ids' => 'required|array',
            'guard_ids.*' => 'exists:guards,id',
        ]);

        Guard::whereIn('id', $validated['guard_ids'])
            ->update(['supervisor_id' => null]);

        return back()->with('success', 'Supervisor unassigned.');
    }

    public function assignToSite(Request $request)
    {
        $validated = $request->validate([
            'guard_id' => 'required|exists:guards,id',
            'client_site_id' => 'required|exists:client_sites,id',
            'start_date' => 'nullable|date',
            'assignment_type' => 'nullable|in:permanent,temporary',
            'notes' => 'nullable|string',
        ]);

        $startDate = $validated['start_date'] ?? now()->toDateString();

        // If already actively assigned to the same site, do nothing
        $alreadyAssigned = GuardAssignment::where('guard_id', $validated['guard_id'])
            ->where('client_site_id', $validated['client_site_id'])
            ->where('is_active', true)
            ->whereNull('end_date')
            ->exists();
        if ($alreadyAssigned) {
            return back()->with('success', 'Guard already assigned to this site.');
        }

        // End any other active assignments for this guard
        GuardAssignment::where('guard_id', $validated['guard_id'])
            ->where('is_active', true)
            ->whereNull('end_date')
            ->update(['end_date' => $startDate, 'is_active' => false, 'active' => false]);

        GuardAssignment::create([
            'guard_id' => $validated['guard_id'],
            'client_site_id' => $validated['client_site_id'],
            'assigned_by' => auth()->id(),
            'start_date' => $startDate,
            'end_date' => null,
            'assignment_type' => $validated['assignment_type'] ?? 'permanent',
            'notes' => $validated['notes'] ?? null,
            'is_active' => true,
            'active' => true,
        ]);

        return back()->with('success', 'Guard assigned to site.');
    }

    public function unassignFromSite(Request $request)
    {
        $validated = $request->validate([
            'guard_id' => 'required|exists:guards,id',
        ]);

        GuardAssignment::where('guard_id', $validated['guard_id'])
            ->whereNull('end_date')
            ->update(['end_date' => now()->toDateString(), 'is_active' => false]);

        return back()->with('success', 'Guard unassigned from site.');
    }

    public function suspend(Guard $guard)
    {
        $this->authorizeOps();
        $this->ensureInZone($guard);
        $guard->update(['status' => 'suspended']);
        return back()->with('success', 'Guard suspended.');
    }

    public function reinstate(Guard $guard)
    {
        $this->authorizeOps();
        $this->ensureInZone($guard);
        $guard->update(['status' => 'active']);
        return back()->with('success', 'Guard reinstated.');
    }

    public function dismiss(Request $request, Guard $guard)
    {
        $this->authorizeOps();
        $this->ensureInZone($guard);
        $request->validate(['reason' => 'nullable|string|max:500']);
        $guard->update([
            'status' => 'dismissed',
            'notes' => trim(($guard->notes ? ($guard->notes."\n") : '') . 'Dismissed: ' . ($request->input('reason') ?? '')),
        ]);
        return back()->with('success', 'Guard dismissed.');
    }

    public function abscond(Request $request, Guard $guard)
    {
        $this->authorizeOps();
        $this->ensureInZone($guard);
        $request->validate(['reason' => 'nullable|string|max:500']);
        $guard->update([
            'status' => 'absconded',
            'notes' => trim(($guard->notes ? ($guard->notes."\n") : '') . 'Absconded: ' . ($request->input('reason') ?? '')),
        ]);
        return back()->with('success', 'Guard marked as absconded.');
    }

    protected function authorizeOps(): void
    {
        if (!auth()->check()) abort(403);
        $u = auth()->user();
        if (!$u->hasAnyRole(['operations_officer','manager','super_admin','hr','hr_manager','zone_commander']) && !$u->can('hr.employees.manage')) {
            abort(403);
        }
    }

    protected function ensureInZone(Guard $guard): void
    {
        $u = auth()->user();
        if (!$u || !$u->hasRole('zone_commander')) return;
        $inZone = false;
        if (!empty($guard->zone_id) && !empty($u->zone_id)) {
            $inZone = (int)$guard->zone_id === (int)$u->zone_id;
        }
        if (!$inZone && !empty($u->zone_id)) {
            $inZone = $guard->assignments()->where('is_active', true)
                ->whereHas('clientSite', function ($q) use ($u) { $q->where('zone_id', $u->zone_id); })
                ->exists();
        }
        if (!$inZone) abort(403);
    }

    private function generateGuardEmployeeId(): string
    {
        do {
            $candidate = 'G-'.now()->format('ym').'-'.sprintf('%04d', random_int(0, 9999));
        } while (Guard::where('employee_id', $candidate)->exists());
        return $candidate;
    }
}
