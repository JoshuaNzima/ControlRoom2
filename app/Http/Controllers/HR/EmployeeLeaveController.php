<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\HR\EmployeeLeave;
use App\Models\User;
use App\Models\Guards\Guard;
use Carbon\Carbon;
use Carbon\CarbonPeriod;

class EmployeeLeaveController extends Controller
{
    public function events(Request $request): JsonResponse
    {
        $request->validate([
            'start' => ['required', 'date'],
            'end' => ['required', 'date', 'after_or_equal:start'],
        ]);

        $start = Carbon::parse($request->query('start'))->startOfDay();
        $end = Carbon::parse($request->query('end'))->endOfDay();

        $events = [];

        // Get employee leaves overlapping the range
        $leaves = EmployeeLeave::with('employee')
            ->whereDate('start_date', '<=', $end->toDateString())
            ->where(function ($q) use ($start) {
                $q->whereNull('end_date')
                  ->orWhereDate('end_date', '>=', $start->toDateString());
            })
            ->where('status', 'approved')
            ->get();

        foreach ($leaves as $leave) {
            $leaveStart = Carbon::parse($leave->start_date)->startOfDay();
            $leaveEnd = $leave->end_date ? Carbon::parse($leave->end_date)->endOfDay() : $leaveStart->copy()->endOfDay();

            $rangeStart = $leaveStart->greaterThan($start) ? $leaveStart : $start->copy();
            $rangeEnd = $leaveEnd->lessThan($end) ? $leaveEnd : $end->copy();

            $period = CarbonPeriod::create($rangeStart->toDateString(), $rangeEnd->toDateString());
            foreach ($period as $day) {
                $employeeName = $this->getEmployeeName($leave->employee);
                $events[] = [
                    'entity' => 'employee_leave',
                    'entity_id' => $leave->id,
                    'date' => $day->toDateString(),
                    'title' => $this->getLeaveTitle($leave, $employeeName),
                    'type' => $leave->type,
                    'color' => $this->getLeaveColor($leave->type),
                    'meta' => [
                        'leave_id' => $leave->id,
                        'employee_type' => $leave->employee_type,
                        'employee_id' => $leave->employee_id,
                        'employee_name' => $employeeName,
                        'reason' => $leave->reason,
                        'leave_type' => $leave->type,
                        'start_date' => $leave->start_date ? Carbon::parse($leave->start_date)->toDateString() : null,
                        'end_date' => $leave->end_date ? Carbon::parse($leave->end_date)->toDateString() : null,
                        'status' => $leave->status,
                    ],
                ];
            }
        }

        return response()->json(['success' => true, 'events' => $events]);
    }

    public function index(Request $request)
    {
        $leaves = EmployeeLeave::with('employee', 'approver')
            ->when($request->query('employee_type'), function ($q, $type) {
                $q->where('employee_type', $type);
            })
            ->when($request->query('status'), function ($q, $status) {
                $q->where('status', $status);
            })
            ->when($request->query('type'), function ($q, $type) {
                $q->where('type', $type);
            })
            ->when($request->query('start_date'), function ($q, $date) {
                $q->whereDate('start_date', '>=', $date);
            })
            ->when($request->query('end_date'), function ($q, $date) {
                $q->whereDate('end_date', '<=', $date);
            })
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($leaves);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_type' => ['required', 'string', 'in:App\Models\User,App\Models\Guards\Guard'],
            'employee_id' => ['required', 'integer'],
            'start_date' => ['required', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'type' => ['required', 'in:off_day,sick_leave,annual_leave,unpaid_leave,maternity_leave,paternity_leave,bereavement_leave'],
            'reason' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'status' => ['nullable', 'in:pending,approved,rejected'],
        ]);

        // Verify employee exists
        $employeeClass = $validated['employee_type'];
        $employee = $employeeClass::findOrFail($validated['employee_id']);

        $leave = EmployeeLeave::create([
            'employee_type' => $validated['employee_type'],
            'employee_id' => $validated['employee_id'],
            'start_date' => Carbon::parse($validated['start_date'])->toDateString(),
            'end_date' => !empty($validated['end_date']) ? Carbon::parse($validated['end_date'])->toDateString() : null,
            'type' => $validated['type'],
            'reason' => $validated['reason'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'status' => $validated['status'] ?? 'approved',
            'approved_by' => ($validated['status'] ?? 'approved') === 'approved' ? auth()->id() : null,
            'approved_at' => ($validated['status'] ?? 'approved') === 'approved' ? now() : null,
        ]);

        return back()->with('success', 'Leave recorded successfully.');
    }

    public function update(Request $request, EmployeeLeave $leave)
    {
        $validated = $request->validate([
            'employee_type' => ['required', 'string', 'in:App\Models\User,App\Models\Guards\Guard'],
            'employee_id' => ['required', 'integer'],
            'start_date' => ['required', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'type' => ['required', 'in:off_day,sick_leave,annual_leave,unpaid_leave,maternity_leave,paternity_leave,bereavement_leave'],
            'reason' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'status' => ['required', 'in:pending,approved,rejected'],
        ]);

        // Verify employee exists
        $employeeClass = $validated['employee_type'];
        $employee = $employeeClass::findOrFail($validated['employee_id']);

        $updateData = [
            'employee_type' => $validated['employee_type'],
            'employee_id' => $validated['employee_id'],
            'start_date' => Carbon::parse($validated['start_date'])->toDateString(),
            'end_date' => !empty($validated['end_date']) ? Carbon::parse($validated['end_date'])->toDateString() : null,
            'type' => $validated['type'],
            'reason' => $validated['reason'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'status' => $validated['status'],
        ];

        // Handle approval tracking
        if ($validated['status'] === 'approved' && $leave->status !== 'approved') {
            $updateData['approved_by'] = auth()->id();
            $updateData['approved_at'] = now();
        } elseif ($validated['status'] !== 'approved') {
            $updateData['approved_by'] = null;
            $updateData['approved_at'] = null;
        }

        $leave->update($updateData);

        return back()->with('success', 'Leave updated successfully.');
    }

    public function destroy(EmployeeLeave $leave)
    {
        $leave->delete();
        return back()->with('success', 'Leave deleted successfully.');
    }

    public function approve(Request $request, EmployeeLeave $leave)
    {
        $leave->update([
            'status' => 'approved',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        return back()->with('success', 'Leave approved successfully.');
    }

    public function reject(Request $request, EmployeeLeave $leave)
    {
        $leave->update([
            'status' => 'rejected',
            'approved_by' => null,
            'approved_at' => null,
        ]);

        return back()->with('success', 'Leave rejected.');
    }

    public function employees(Request $request): JsonResponse
    {
        $search = $request->query('search', '');
        $type = $request->query('type', 'all'); // 'all', 'users', 'guards'
        $perPage = min((int) $request->query('per_page', 50), 100); // Max 100 per page
        $page = (int) $request->query('page', 1);

        $employees = [];
        $hasMore = false;

        if (in_array($type, ['all', 'guards'])) {
            $guardsQuery = Guard::query()
                ->when($search, function ($q, $search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('employee_id', 'like', "%{$search}%");
                });

            $guardsTotal = $guardsQuery->count();
            $hasMore = $hasMore || ($guardsTotal > $perPage * $page);

            $guards = $guardsQuery
                ->orderBy('name')
                ->limit($perPage)
                ->offset(($page - 1) * $perPage)
                ->get(['id', 'name', 'employee_id'])
                ->map(function ($g) {
                    return [
                        'id' => $g->id,
                        'name' => $g->name,
                        'employee_id' => $g->employee_id,
                        'type' => 'guard',
                        'type_label' => 'Guard',
                        'model' => Guard::class,
                    ];
                });
            $employees = array_merge($employees, $guards->toArray());
        }

        if (in_array($type, ['all', 'users'])) {
            $usersQuery = User::query()
                ->when($search, function ($q, $search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                })
                ->whereHas('roles', function ($q) {
                    $q->whereIn('name', [
                        'admin', 'hr', 'finance', 'operations_officer',
                        'control_room_operator', 'asset_manager', 'front_desk', 'supervisor'
                    ]);
                });

            $usersTotal = $usersQuery->count();
            $hasMore = $hasMore || ($usersTotal > $perPage * $page);

            $users = $usersQuery
                ->orderBy('name')
                ->limit($perPage)
                ->offset(($page - 1) * $perPage)
                ->get(['id', 'name', 'email'])
                ->map(function ($u) {
                    return [
                        'id' => $u->id,
                        'name' => $u->name,
                        'employee_id' => $u->email,
                        'type' => 'user',
                        'type_label' => 'Staff',
                        'model' => User::class,
                    ];
                });
            $employees = array_merge($employees, $users->toArray());
        }

        // Sort combined results by name
        usort($employees, function ($a, $b) {
            return strcasecmp($a['name'], $b['name']);
        });

        // Re-apply limit after merging
        $employees = array_slice($employees, 0, $perPage);

        return response()->json([
            'success' => true,
            'employees' => $employees,
            'meta' => [
                'page' => $page,
                'per_page' => $perPage,
                'has_more' => $hasMore,
            ]
        ]);
    }

    private function getEmployeeName($employee): string
    {
        if (!$employee) {
            return 'Unknown';
        }
        return $employee->name ?? $employee->email ?? 'Unknown';
    }

    private function getLeaveTitle($leave, $employeeName): string
    {
        $typeLabels = [
            'off_day' => 'Off',
            'sick_leave' => 'Sick',
            'annual_leave' => 'AL',
            'unpaid_leave' => 'Unpaid',
            'maternity_leave' => 'ML',
            'paternity_leave' => 'PL',
            'bereavement_leave' => 'Bereavement',
        ];

        $label = $typeLabels[$leave->type] ?? 'Leave';
        return "{$label}: {$employeeName}";
    }

    private function getLeaveColor(string $type): string
    {
        $colors = [
            'off_day' => 'indigo',
            'sick_leave' => 'amber',
            'annual_leave' => 'emerald',
            'unpaid_leave' => 'gray',
            'maternity_leave' => 'pink',
            'paternity_leave' => 'blue',
            'bereavement_leave' => 'purple',
        ];

        return $colors[$type] ?? 'indigo';
    }
}
