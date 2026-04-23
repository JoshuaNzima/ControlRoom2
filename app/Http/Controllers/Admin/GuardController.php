<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Guards\Guard;
use App\Models\Guards\Attendance;
use App\Models\Guards\GuardAssignment;
use App\Models\Guards\ClientSite;
use App\Models\Guards\Client;
use App\Models\Guards\GuardGrade;
use App\Models\Zone;
use App\Models\PayProfile;
use App\Models\User;
use App\Services\GuardDuplicateDetectionService;
use App\Events\GuardDismissed;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Inertia\Inertia;

class GuardController extends Controller
{
    public function dashboard()
    {
        $base = Guard::query()->where('employee_role', 'guard');
        $total = (clone $base)->count();
        $active = (clone $base)->where('status', 'active')->count();
        $inactive = (clone $base)->where('status', 'inactive')->count();
        $suspended = (clone $base)->where('status', 'suspended')->count();

        $recent = Guard::query()
            ->where('employee_role', 'guard')
            ->latest()
            ->limit(5)
            ->get(['id', 'name', 'employee_id', 'status']);

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
        $perPage = request('per_page', 20);
        
        // Get guards with site assignment info
        $guards = Guard::with(['supervisor', 'assignments.site'])
            ->where('employee_role', 'guard')
            ->when(request('search'), function($q, $search) {
                $q->where(function($sq) use ($search) {
                    $sq->where('name', 'like', "%{$search}%")
                       ->orWhere('employee_id', 'like', "%{$search}%")
                       ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->when(request('status'), function($q, $status) {
                $q->where('status', $status);
            })
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString();

        // Transform guard data with performance metrics
        $monthStart = now()->startOfMonth();
        $monthEnd = now()->endOfMonth();
        
        $guards->getCollection()->transform(function ($g) use ($monthStart, $monthEnd) {
            // Get current site assignment
            $currentAssignment = $g->assignments->firstWhere('status', 'active');
            
            // Calculate attendance rate for this month
            $totalDays = Attendance::where('guard_id', $g->id)
                ->whereBetween('date', [$monthStart, $monthEnd])
                ->count();
            $presentDays = Attendance::where('guard_id', $g->id)
                ->whereBetween('date', [$monthStart, $monthEnd])
                ->where('status', 'present')
                ->count();
            $attendanceRate = $totalDays > 0 ? round(($presentDays / $totalDays) * 100) : null;
            
            // Calculate shifts this month
            $shiftsThisMonth = Attendance::where('guard_id', $g->id)
                ->whereBetween('date', [$monthStart, $monthEnd])
                ->whereNotNull('check_in_time')
                ->count();
            
            // Simple performance score based on attendance and profile completeness
            $performanceScore = null;
            if ($attendanceRate !== null) {
                $profileWeight = $g->is_profile_complete ? 10 : 0;
                $performanceScore = min(100, round($attendanceRate * 0.9) + $profileWeight);
            }
            
            return [
                'id' => $g->id,
                'name' => $g->name,
                'employee_id' => $g->employee_id,
                'phone' => $g->phone,
                'email' => $g->email,
                'status' => $g->status,
                'supervisor' => $g->supervisor ? ['id' => $g->supervisor->id, 'name' => $g->supervisor->name] : null,
                'site' => $currentAssignment && $currentAssignment->site ? ['id' => $currentAssignment->site->id, 'name' => $currentAssignment->site->name] : null,
                'is_profile_complete' => (bool) $g->is_profile_complete,
                'is_on_duty' => (bool) $currentAssignment,
                'attendance_rate' => $attendanceRate,
                'performance_score' => $performanceScore,
                'shifts_this_month' => $shiftsThisMonth,
                'joined_date' => $g->created_at?->format('Y-m-d'),
            ];
        });

        // Calculate overall stats
        $totalGuards = Guard::where('employee_role', 'guard')->count();
        $activeGuards = Guard::where('employee_role', 'guard')->where('status', 'active')->count();
        $onDutyToday = Attendance::whereDate('date', today())
            ->whereNotNull('check_in_time')
            ->distinct('guard_id')
            ->count('guard_id');
        
        // Average attendance across all guards
        $allAttendances = Attendance::whereBetween('date', [$monthStart, $monthEnd])
            ->selectRaw('guard_id, COUNT(*) as total, SUM(CASE WHEN status = "present" THEN 1 ELSE 0 END) as present')
            ->groupBy('guard_id')
            ->get();
        $avgAttendance = $allAttendances->count() > 0 
            ? round($allAttendances->avg(fn($a) => $a->total > 0 ? ($a->present / $a->total) * 100 : 0))
            : 0;
        
        // Average performance (simplified)
        $avgPerformance = $avgAttendance > 0 ? min(100, round($avgAttendance * 0.9) + 5) : 0;

        return Inertia::render('Admin/Guards/Index', [
            'guards' => $guards,
            'filters' => request()->only(['search', 'status', 'per_page']),
            'stats' => [
                'total_guards' => $totalGuards,
                'active_guards' => $activeGuards,
                'on_duty_today' => $onDutyToday,
                'average_attendance' => $avgAttendance,
                'average_performance' => $avgPerformance,
                'total_incidents' => 0, // Placeholder - can be implemented with incident tracking
            ],
        ]);
    }

    public function create()
    {
        $this->authorize('create', Guard::class);
        
        $canAssignSupervisor = auth()->user()->can('assign_guard_supervisor');
        $supervisors = [];
        $grades = GuardGrade::orderBy('name')->get(['id','code','name']);
        
        if ($canAssignSupervisor) {
            $supervisors = User::role(['supervisor'])
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
        $request->merge([
            'id_number' => ($v = trim((string) $request->input('id_number'))) !== '' ? $v : null,
            'emergency_contact_name' => ($v = trim((string) $request->input('emergency_contact_name'))) !== '' ? $v : null,
            'emergency_contact_phone' => ($v = trim((string) $request->input('emergency_contact_phone'))) !== '' ? $v : null,
        ]);

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
            'status' => 'required|in:active,inactive,suspended,dismissed,absconded',
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
                    'assignment_type' => 'permanent',
                    'notes' => null,
                    'is_active' => true,
                    'active' => true,
                ]);
            }
        }

        return redirect()->back()
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
            $supervisors = User::role(['supervisor'])
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

        $request->merge([
            'id_number' => ($v = trim((string) $request->input('id_number'))) !== '' ? $v : null,
            'emergency_contact_name' => ($v = trim((string) $request->input('emergency_contact_name'))) !== '' ? $v : null,
            'emergency_contact_phone' => ($v = trim((string) $request->input('emergency_contact_phone'))) !== '' ? $v : null,
        ]);
        
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
            'status' => 'required|in:active,inactive,suspended,dismissed,absconded',
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

        return redirect()->back()
            ->withSuccess('Guard updated successfully.');
    }

    public function suspend(Guard $guard)
    {
        // Admins can set status directly
        $guard->update(['status' => 'suspended']);
        return redirect()->back()->withSuccess('Guard suspended.');
    }

    public function reinstate(Guard $guard)
    {
        $guard->update(['status' => 'active']);
        return redirect()->back()->withSuccess('Guard reinstated.');
    }

    public function dismiss(Request $request, Guard $guard)
    {
        $request->validate(['reason' => ['nullable','string','max:500']]);
        $guard->update([
            'status' => 'dismissed',
            'notes' => trim(($guard->notes ? ($guard->notes."\n") : '') . 'Dismissed: ' . ($request->input('reason') ?? '')),
        ]);

        // Dispatch event for push notification
        GuardDismissed::dispatch($guard, $request->input('reason') ?? 'No reason provided', $request->user()->id);

        return redirect()->back()->withSuccess('Guard dismissed.');
    }

    public function abscond(Request $request, Guard $guard)
    {
        $request->validate(['reason' => ['nullable','string','max:500']]);
        $guard->update([
            'status' => 'absconded',
            'notes' => trim(($guard->notes ? ($guard->notes."\n") : '') . 'Absconded: ' . ($request->input('reason') ?? '')),
        ]);
        return redirect()->back()->withSuccess('Guard marked as absconded.');
    }

    public function resign(Request $request, Guard $guard)
    {
        $request->validate(['reason' => ['nullable','string','max:500']]);
        $guard->update([
            'status' => 'inactive',
            'notes' => trim(($guard->notes ? ($guard->notes."\n") : '') . 'Resigned: ' . ($request->input('reason') ?? '')),
        ]);
        return redirect()->back()->withSuccess('Guard marked as resigned.');
    }

    public function apiShow(Guard $guard)
    {
        $guard->load([
            'supervisor',
            'zone',
            'grade',
            'currentAssignmentRelation.site.client',
            'assignments' => fn ($q) => $q->where('is_active', true)->with('site.client')->limit(5),
        ]);

        $monthStart = now()->startOfMonth()->toDateString();
        $monthEnd = now()->endOfMonth()->toDateString();

        // Attendance tally for current month
        $byStatus = Attendance::query()
            ->where('guard_id', $guard->id)
            ->whereBetween('date', [$monthStart, $monthEnd])
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status')
            ->map(fn ($v) => (int) $v)
            ->all();

        $hoursRow = Attendance::query()
            ->where('guard_id', $guard->id)
            ->whereBetween('date', [$monthStart, $monthEnd])
            ->select(
                DB::raw('coalesce(sum(hours_worked), 0) as hours_worked'),
                DB::raw('coalesce(sum(overtime_hours), 0) as overtime_hours')
            )
            ->first();

        // Recent attendance (last 7 days)
        $recentAttendance = Attendance::query()
            ->where('guard_id', $guard->id)
            ->whereDate('date', '>=', now()->subDays(7))
            ->orderBy('date', 'desc')
            ->limit(7)
            ->get(['date', 'status', 'check_in_time', 'check_out_time', 'hours_worked', 'site_id'])
            ->map(fn ($a) => [
                'date' => $a->date?->format('Y-m-d'),
                'status' => $a->status,
                'check_in' => $a->check_in_time?->format('H:i'),
                'check_out' => $a->check_out_time?->format('H:i'),
                'hours' => $a->hours_worked,
            ])->toArray();

        // Recent infractions (last 3 months)
        $recentInfractions = $guard->infractions()
            ->where('created_at', '>=', now()->subMonths(3))
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get(['id', 'type', 'severity', 'description', 'status', 'created_at'])
            ->map(fn ($i) => [
                'id' => $i->id,
                'type' => $i->type,
                'severity' => $i->severity,
                'description' => $i->description,
                'status' => $i->status,
                'date' => $i->created_at?->format('Y-m-d'),
            ])->toArray();

        // Documents (if GuardDocuments model exists)
        $documents = [];
        if (class_exists(\App\Models\GuardDocuments::class)) {
            $documents = \App\Models\GuardDocuments::where('guard_id', $guard->id)
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get(['id', 'document_type', 'document_name', 'file_path', 'is_verified', 'created_at'])
                ->map(fn ($d) => [
                    'id' => $d->id,
                    'type' => $d->document_type,
                    'name' => $d->document_name,
                    'verified' => $d->is_verified,
                    'date' => $d->created_at?->format('Y-m-d'),
                ])->toArray();
        }

        // Calculate attendance rate
        $totalAttendance = array_sum($byStatus);
        $presentDays = $byStatus['present'] ?? 0;
        $attendanceRate = $totalAttendance > 0 ? round(($presentDays / $totalAttendance) * 100) : null;

        // Get current assignment details
        $currentAssignment = $guard->currentAssignmentRelation;

        return response()->json(array_merge($guard->toArray(), [
            'attendance_tally' => [
                'range' => ['start' => $monthStart, 'end' => $monthEnd],
                'by_status' => $byStatus,
                'total' => $totalAttendance,
                'hours_worked' => (float) ($hoursRow->hours_worked ?? 0),
                'overtime_hours' => (float) ($hoursRow->overtime_hours ?? 0),
                'rate_percent' => $attendanceRate,
            ],
            'recent_attendance' => $recentAttendance,
            'recent_infractions' => $recentInfractions,
            'documents' => $documents,
            'current_assignment' => $currentAssignment ? [
                'site' => $currentAssignment->site ? [
                    'id' => $currentAssignment->site->id,
                    'name' => $currentAssignment->site->name,
                    'client' => $currentAssignment->site->client ? [
                        'id' => $currentAssignment->site->client->id,
                        'name' => $currentAssignment->site->client->name,
                    ] : null,
                ] : null,
                'start_date' => $currentAssignment->start_date,
                'end_date' => $currentAssignment->end_date,
                'assignment_type' => $currentAssignment->assignment_type,
            ] : null,
            'zone' => $guard->zone ? [
                'id' => $guard->zone->id,
                'name' => $guard->zone->name,
            ] : null,
            'grade' => $guard->grade ? [
                'id' => $guard->grade->id,
                'code' => $guard->grade->code,
                'name' => $guard->grade->name,
            ] : null,
        ]));
    }

    public function bulkImportTemplate()
    {
        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // Headers (Employee ID is auto-generated, not included in template)
        $headers = ['Name', 'Phone', 'Email', 'ID Number', 'Date of Birth', 'Gender', 'Address', 'Guard Type', 'Status', 'Hire Date', 'Emergency Contact Name', 'Emergency Contact Phone'];
        $column = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue($column . '1', $header);
            $column++;
        }

        // Example row (Employee ID auto-generated)
        $example = ['John Doe', '+265999123456', 'john@example.com', '123456789', '1990-05-15', 'male', 'Blantyre', 'permanent', 'active', '2024-01-01', 'Jane Doe', '+265999654321'];
        $column = 'A';
        foreach ($example as $value) {
            $sheet->setCellValue($column . '2', $value);
            $column++;
        }

        // Auto-size columns (A to L - 12 columns, Employee ID removed)
        foreach (range('A', 'L') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        // Style headers
        $headerRange = 'A1:L1';
        $sheet->getStyle($headerRange)->getFont()->setBold(true);
        $sheet->getStyle($headerRange)->getFill()
            ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
            ->getStartColor()->setRGB('EEEEEE');

        // Create response
        $writer = IOFactory::createWriter($spreadsheet, 'Xlsx');
        $tempFile = tempnam(sys_get_temp_dir(), 'guard_template_');
        $writer->save($tempFile);

        return response()->download(
            $tempFile,
            'guard_import_template.xlsx',
            ['Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
        )->deleteFileAfterSend(true);
    }

    public function bulkImport(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv',
        ]);

        $allowUpdates = $request->boolean('allow_updates');

        try {
            $file = $request->file('file');
            $spreadsheet = IOFactory::load($file->getPathname());
            $worksheet = $spreadsheet->getActiveSheet();
            $rows = $worksheet->toArray();

            $headerRow = array_shift($rows);
            $headerMap = [];
            if (is_array($headerRow)) {
                foreach ($headerRow as $i => $h) {
                    $key = strtolower(trim((string) $h));
                    if ($key !== '') {
                        $headerMap[$key] = (int) $i;
                    }
                }
            }

            $useFallbackIndexes = empty($headerMap);

            $col = function (array $row, array $keys, ?int $fallbackIndex = null) use ($headerMap, $useFallbackIndexes) {
                foreach ($keys as $k) {
                    $kk = strtolower(trim((string) $k));
                    if (isset($headerMap[$kk])) {
                        $idx = $headerMap[$kk];
                        return $row[$idx] ?? null;
                    }
                }
                if ($useFallbackIndexes && $fallbackIndex !== null) {
                    return $row[$fallbackIndex] ?? null;
                }
                return null;
            };

            $records = [];
            foreach ($rows as $index => $row) {
                if (empty($col($row, ['name'], 0))) {
                    continue;
                }
                $rowNum = $index + 2;
                $records[] = [
                    'row_num' => $rowNum,
                    'data' => [
                        'name' => $col($row, ['name'], 0),
                        'phone' => $col($row, ['phone'], 1),
                        'id_number' => $col($row, ['id number', 'id_number'], 3),
                        'date_of_birth' => $col($row, ['date of birth', 'date_of_birth', 'dob'], 4),
                    ],
                ];
            }

            $duplicateDetector = new GuardDuplicateDetectionService();
            $duplicateReport = $duplicateDetector->detect($records);
            $fileDuplicateReasonsByRow = [];
            foreach (($duplicateReport['file_duplicate_rows'] ?? []) as $item) {
                $fileDuplicateReasonsByRow[(int) $item['row_num']] = (array) ($item['reasons'] ?? []);
            }

            $dbDuplicateReasonsByRow = [];
            foreach (($duplicateReport['db_duplicate_rows'] ?? []) as $item) {
                $dbDuplicateReasonsByRow[(int) $item['row_num']] = (array) ($item['reasons'] ?? []);
            }

            $results = [
                'success' => 0,
                'failed' => 0,
                'errors' => [],
            ];

            DB::beginTransaction();

            try {
                foreach ($rows as $index => $row) {
                    // Skip empty rows
                    if (empty($col($row, ['name'], 0))) {
                        continue;
                    }

                    $rowNum = $index + 2;

                    if (isset($fileDuplicateReasonsByRow[$rowNum]) && count($fileDuplicateReasonsByRow[$rowNum]) > 0) {
                        $results['failed']++;
                        $results['errors'][] = 'Row ' . $rowNum . ': ' . implode(', ', $fileDuplicateReasonsByRow[$rowNum]);
                        continue;
                    }

                    $rowHasDbDuplicate = isset($dbDuplicateReasonsByRow[$rowNum]) && count($dbDuplicateReasonsByRow[$rowNum]) > 0;
                    if ($rowHasDbDuplicate && !$allowUpdates) {
                        $results['failed']++;
                        $results['errors'][] = 'Row ' . $rowNum . ': ' . implode(', ', $dbDuplicateReasonsByRow[$rowNum]);
                        continue;
                    }

                    $existingGuard = null;
                    if ($rowHasDbDuplicate && $allowUpdates) {
                        $idNumber = trim((string) ($col($row, ['id number', 'id_number'], 3) ?? ''));
                        $phoneRaw = (string) ($col($row, ['phone'], 1) ?? '');
                        $phoneDigits = preg_replace('/\D+/', '', $phoneRaw);
                        $name = trim((string) ($col($row, ['name'], 0) ?? ''));
                        $dob = trim((string) ($col($row, ['date of birth', 'date_of_birth', 'dob'], 4) ?? ''));

                        // Lookup by ID Number, Phone, or Name+DOB (Employee ID is auto-generated, not in import)
                        if ($idNumber !== '') {
                            $existingGuard = Guard::where('id_number', $idNumber)->first();
                        }
                        if (!$existingGuard && $phoneDigits !== '') {
                            $existingGuard = Guard::where('phone', $phoneDigits)->orWhere('phone', '+' . $phoneDigits)->first();
                        }
                        if (!$existingGuard && $name !== '' && $dob !== '') {
                            $existingGuard = Guard::where('name', $name)->whereDate('date_of_birth', $dob)->first();
                        }

                        if (!$existingGuard) {
                            $results['failed']++;
                            $results['errors'][] = 'Row ' . $rowNum . ': Duplicate detected but no matching guard found to update';
                            continue;
                        }
                    }

                    $validator = Validator::make([
                        'name' => $col($row, ['name'], 0),
                        'phone' => $col($row, ['phone'], 1),
                        'email' => $col($row, ['email'], 2),
                        'id_number' => $col($row, ['id number', 'id_number'], 3),
                        'date_of_birth' => $col($row, ['date of birth', 'date_of_birth', 'dob'], 4),
                        'gender' => $col($row, ['gender'], 5),
                        'address' => $col($row, ['address'], 6),
                        'guard_type' => $col($row, ['guard type', 'guard_type'], 7) ?? 'permanent',
                        'status' => $col($row, ['status'], 8) ?? 'active',
                        'hire_date' => $col($row, ['hire date', 'hire_date'], 9),
                        'emergency_contact_name' => $col($row, ['emergency contact name', 'emergency_contact_name'], 10),
                        'emergency_contact_phone' => $col($row, ['emergency contact phone', 'emergency_contact_phone'], 11),
                    ], [
                        'name' => 'required|string|max:255',
                        'employee_id' => ['nullable','string','max:255', $existingGuard ? Rule::unique('guards', 'employee_id')->ignore($existingGuard->id) : Rule::unique('guards', 'employee_id')],
                        'phone' => 'nullable|string|max:20',
                        'email' => ['nullable','email','max:255', $existingGuard ? Rule::unique('guards', 'email')->ignore($existingGuard->id) : Rule::unique('guards', 'email')],
                        'id_number' => ['nullable','string','max:50', $existingGuard ? Rule::unique('guards', 'id_number')->ignore($existingGuard->id) : Rule::unique('guards', 'id_number')],
                        'date_of_birth' => 'nullable|date',
                        'gender' => 'nullable|in:male,female,other',
                        'address' => 'nullable|string',
                        'guard_type' => 'nullable|in:permanent,standby,reliever',
                        'status' => 'nullable|in:active,inactive,suspended,dismissed,absconded',
                        'hire_date' => 'nullable|date',
                        'emergency_contact_name' => 'nullable|string|max:255',
                        'emergency_contact_phone' => 'nullable|string|max:20',
                    ]);

                    if ($validator->fails()) {
                        $results['failed']++;
                        $results['errors'][] = 'Row ' . $rowNum . ': ' . implode(', ', $validator->errors()->all());
                        continue;
                    }

                    $validatedData = $validator->validated();

                    // Generate employee_id if not provided (never overwrite existing)
                    if (empty($validatedData['employee_id'])) {
                        $validatedData['employee_id'] = $existingGuard ? $existingGuard->employee_id : $this->generateGuardEmployeeId();
                    }

                    // Set defaults
                    $validatedData['employee_role'] = 'guard';
                    $validatedData['status'] = $validatedData['status'] ?? 'active';
                    $validatedData['guard_type'] = $validatedData['guard_type'] ?? 'permanent';

                    if ($existingGuard) {
                        $existingGuard->fill($validatedData);
                        $existingGuard->save();
                        $results['success']++;
                        continue;
                    }

                    Guard::create($validatedData);
                    $results['success']++;
                }

                DB::commit();

                return back()
                    ->with('import_results', $results)
                    ->withSuccess("Successfully imported {$results['success']} guards. Failed: {$results['failed']}");
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Exception $e) {
            return back()->withErrors([
                'file' => 'Failed to process import file: ' . $e->getMessage(),
            ]);
        }
    }

    public function updateCompliance(Request $request, Guard $guard)
    {
        $this->authorize('update', $guard);

        $validated = $request->validate([
            'fingerprint_registered' => 'nullable|boolean',
            'uniform_issued' => 'nullable|boolean',
            'equipment_issued' => 'nullable|array',
            'equipment_issued.*' => 'string|max:100',
        ]);

        $guard->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Compliance updated successfully',
            'guard' => [
                'id' => $guard->id,
                'fingerprint_registered' => $guard->fingerprint_registered,
                'uniform_issued' => $guard->uniform_issued,
                'equipment_issued' => $guard->equipment_issued,
            ],
        ]);
    }
}