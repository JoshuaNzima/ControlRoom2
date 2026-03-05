<?php

namespace App\Http\Controllers\ControlRoom;

use App\Http\Controllers\Controller;
use App\Models\Guards\Guard;
use App\Models\Guards\GuardAssignment;
use App\Models\Guards\ClientSite;
use App\Models\Guards\GuardGrade;
use App\Models\PayProfile;
use App\Models\User;
use App\Services\GuardDuplicateDetectionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use PhpOffice\PhpSpreadsheet\IOFactory;

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
            'reports_to_guard_id' => 'nullable|exists:guards,id',
            'hire_date' => 'nullable|date',
            'guard_type' => 'required|in:permanent,standby,reliever',
            'position' => 'required|in:guard,supervisor,sergeant',
            'guard_grade_id' => 'nullable|exists:guard_grades,id',
            'status' => 'required|in:active,inactive,suspended,dismissed,absconded',
            'notes' => 'nullable|string',
            'children_names' => 'nullable|string',
            'photo' => 'nullable|image|max:5120',
            'client_site_id' => 'nullable|exists:client_sites,id',
        ]);

        if (empty($validated['hire_date'])) {
            $validated['hire_date'] = now()->toDateString();
        }

        if (!auth()->user()->hasAnyRole(['operations_officer','manager','super_admin'])) {
            unset($validated['supervisor_id']);
            unset($validated['reports_to_guard_id']);
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
        // Check edit limit
        if ($guard->edit_count >= 3) {
            return back()->with('error', 'This guard has reached the maximum edit limit (3 edits). Contact an administrator for further changes.');
        }

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
            'spouse_name' => 'nullable|string|max:255',
            'spouse_phone' => 'nullable|string|max:20',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:20',
            'next_of_kin_name' => 'nullable|string|max:255',
            'next_of_kin_relationship' => 'nullable|string|max:50',
            'next_of_kin_phone' => 'nullable|string|max:20',
            'supervisor_id' => 'nullable|exists:users,id',
            'reports_to_guard_id' => 'nullable|exists:guards,id',
            'hire_date' => 'nullable|date',
            'guard_type' => 'required|in:permanent,standby,reliever',
            'position' => 'required|in:guard,supervisor,sergeant',
            'guard_grade_id' => 'nullable|exists:guard_grades,id',
            'status' => 'required|in:active,inactive,suspended,dismissed,absconded',
            'notes' => 'nullable|string',
            'children_names' => 'nullable|string',
            'home_village' => 'nullable|string|max:255',
            'home_ta' => 'nullable|string|max:255',
            'home_district' => 'nullable|string|max:255',
            'education_level' => 'nullable|string|max:100',
            'qualifications' => 'nullable',
            'languages' => 'nullable',
            'dependents_count' => 'nullable|integer|min:0',
            'default_off_day' => 'nullable|integer|between:0,6',
            'photo' => 'nullable|image|max:5120',
        ]);

        if (!auth()->user()->hasAnyRole(['operations_officer','manager','super_admin'])) {
            unset($validated['supervisor_id']);
            unset($validated['reports_to_guard_id']);
        }

        if ($request->hasFile('photo')) {
            $validated['photo'] = $request->file('photo')->store('guards', 'public');
        }

        // Increment edit count
        $validated['edit_count'] = ($guard->edit_count ?? 0) + 1;

        $guard->update($validated);

        $remaining = 3 - $guard->edit_count;
        return back()->with('success', "Guard updated. {$remaining} edit(s) remaining.");
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
            'leader_id' => 'required|exists:guards,id',
        ]);

        $leader = Guard::findOrFail($validated['leader_id']);
        if (!$leader->isLeader()) {
            return back()->with('error', 'Selected guard is not a supervisor or sergeant.');
        }

        Guard::whereIn('id', $validated['guard_ids'])
            ->update(['reports_to_guard_id' => $validated['leader_id']]);

        return back()->with('success', ucfirst($leader->position) . ' assigned to ' . count($validated['guard_ids']) . ' guards.');
    }

    public function unassignSupervisor(Request $request)
    {
        $validated = $request->validate([
            'guard_ids' => 'required|array',
            'guard_ids.*' => 'exists:guards,id',
        ]);

        Guard::whereIn('id', $validated['guard_ids'])
            ->update(['reports_to_guard_id' => null]);

        return back()->with('success', 'Leader unassigned.');
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

        $alreadyAssigned = GuardAssignment::where('guard_id', $validated['guard_id'])
            ->where('client_site_id', $validated['client_site_id'])
            ->where('is_active', true)
            ->whereNull('end_date')
            ->exists();
        if ($alreadyAssigned) {
            return back()->with('success', 'Guard already assigned to this site.');
        }

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

    public function resign(Request $request, Guard $guard)
    {
        $this->authorizeOps();
        $this->ensureInZone($guard);
        $request->validate(['reason' => 'nullable|string|max:500']);
        $status = $request->input('status', 'resigned');
        $guard->update([
            'status' => $status,
            'notes' => trim(($guard->notes ? ($guard->notes."\n") : '') . ucfirst($status) . ': ' . ($request->input('reason') ?? '')),
        ]);
        return back()->with('success', 'Guard marked as ' . $status . '.');
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

    public function bulkImportTemplate()
    {
        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // Headers
        $headers = [
            'name', 'employee_id', 'phone', 'email', 'id_number', 'date_of_birth',
            'gender', 'marital_status', 'emergency_contact_name', 'emergency_contact_phone',
            'address', 'hire_date', 'guard_type', 'position', 'status', 'notes'
        ];

        foreach ($headers as $index => $header) {
            $sheet->setCellValue(\PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($index + 1) . '1', $header);
        }

        // Sample data row
        $sample = [
            'John Doe', '', '+265991234567', 'john@example.com', 'MA123456', '1990-05-15',
            'male', 'single', 'Jane Doe', '+265997654321',
            'Blantyre', '2024-01-01', 'permanent', 'guard', 'active', 'New guard'
        ];

        foreach ($sample as $index => $value) {
            $sheet->setCellValue(\PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($index + 1) . '2', $value);
        }

        // Auto-size columns
        foreach (range('A', 'O') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $writer = IOFactory::createWriter($spreadsheet, 'Xlsx');
        $filename = 'guard_import_template.xlsx';

        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment;filename="' . $filename . '"');
        header('Cache-Control: max-age=0');

        $writer->save('php://output');
        exit;
    }

    public function bulkImport(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:xlsx,xls|max:10240',
        ]);

        $allowUpdates = $request->boolean('allow_updates');

        if ($validator->fails()) {
            return back()->withErrors(['file' => 'Please upload a valid Excel file (.xlsx or .xls)']);
        }

        try {
            $file = $request->file('file');
            $spreadsheet = IOFactory::load($file->getPathname());
            $sheet = $spreadsheet->getActiveSheet();
            $rows = $sheet->toArray();

            // Parse header row for flexible column mapping
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
                if (empty($row[0])) continue;
                $rowNum = $index + 2;
                $records[] = [
                    'row_num' => $rowNum,
                    'data' => [
                        'name' => $col($row, ['name'], 0),
                        'employee_id' => $col($row, ['employee id', 'employee_id'], 1),
                        'phone' => $col($row, ['phone'], 2),
                        'id_number' => $col($row, ['id number', 'id_number'], 4),
                        'date_of_birth' => $col($row, ['date of birth', 'date_of_birth', 'dob'], 5),
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

            $imported = 0;
            $errors = [];

            foreach ($rows as $index => $row) {
                // Skip empty rows
                if (empty($row[0])) continue;

                $rowNum = $index + 2;

                if (isset($fileDuplicateReasonsByRow[$rowNum]) && count($fileDuplicateReasonsByRow[$rowNum]) > 0) {
                    $errors[] = "Row {$rowNum}: " . implode(', ', $fileDuplicateReasonsByRow[$rowNum]);
                    continue;
                }

                $rowHasDbDuplicate = isset($dbDuplicateReasonsByRow[$rowNum]) && count($dbDuplicateReasonsByRow[$rowNum]) > 0;
                if ($rowHasDbDuplicate && !$allowUpdates) {
                    $errors[] = "Row {$rowNum}: " . implode(', ', $dbDuplicateReasonsByRow[$rowNum]);
                    continue;
                }

                $existingGuard = null;
                if ($rowHasDbDuplicate && $allowUpdates) {
                    $employeeId = trim((string) ($col($row, ['employee id', 'employee_id'], 1) ?? ''));
                    $idNumber = trim((string) ($col($row, ['id number', 'id_number'], 4) ?? ''));
                    $phoneRaw = (string) ($col($row, ['phone'], 2) ?? '');
                    $phoneDigits = preg_replace('/\D+/', '', $phoneRaw);
                    $name = trim((string) ($col($row, ['name'], 0) ?? ''));
                    $dob = trim((string) ($col($row, ['date of birth', 'date_of_birth', 'dob'], 5) ?? ''));

                    if ($employeeId !== '') {
                        $existingGuard = Guard::where('employee_id', $employeeId)->first();
                    }
                    if (!$existingGuard && $idNumber !== '') {
                        $existingGuard = Guard::where('id_number', $idNumber)->first();
                    }
                    if (!$existingGuard && $phoneDigits !== '') {
                        $existingGuard = Guard::where('phone', $phoneDigits)->orWhere('phone', '+' . $phoneDigits)->first();
                    }
                    if (!$existingGuard && $name !== '' && $dob !== '') {
                        $existingGuard = Guard::where('name', $name)->whereDate('date_of_birth', $dob)->first();
                    }

                    if (!$existingGuard) {
                        $errors[] = "Row {$rowNum}: Duplicate detected but no matching guard found to update";
                        continue;
                    }
                }

                $data = [
                    'name' => $col($row, ['name'], 0),
                    'phone' => $col($row, ['phone'], 2),
                    'email' => $col($row, ['email'], 3),
                    'id_number' => $col($row, ['id number', 'id_number'], 4),
                    'date_of_birth' => $col($row, ['date of birth', 'date_of_birth', 'dob'], 5),
                    'gender' => $col($row, ['gender'], 6),
                    'marital_status' => $col($row, ['marital status', 'marital_status'], 7),
                    'emergency_contact_name' => $col($row, ['emergency contact name', 'emergency_contact_name'], 8),
                    'emergency_contact_phone' => $col($row, ['emergency contact phone', 'emergency_contact_phone'], 9),
                    'address' => $col($row, ['address'], 10),
                    'hire_date' => $col($row, ['hire date', 'hire_date'], 11),
                    'guard_type' => $col($row, ['guard type', 'guard_type'], 12) ?? 'permanent',
                    'position' => $col($row, ['position'], 13) ?? 'guard',
                    'status' => $col($row, ['status'], 14) ?? 'active',
                    'notes' => $col($row, ['notes'], 15),
                ];

                // Extract employee_id from file (if column exists and has value)
                $fileEmployeeId = trim((string) ($col($row, ['employee id', 'employee_id'], 1) ?? ''));

                // Generate employee_id if not provided (never overwrite existing)
                if (empty($fileEmployeeId)) {
                    $data['employee_id'] = $existingGuard ? $existingGuard->employee_id : $this->generateGuardEmployeeId();
                } else {
                    // Use provided employee_id for new guards, or keep existing for updates
                    $data['employee_id'] = $existingGuard ? $existingGuard->employee_id : $fileEmployeeId;
                }

                // Validate required fields
                if (empty($data['name'])) {
                    $errors[] = "Row {$rowNum}: Name is required";
                    continue;
                }

                if (empty($data['phone'])) {
                    $errors[] = "Row {$rowNum}: Phone is required";
                    continue;
                }

                try {
                    $validatorRow = Validator::make($data, [
                        'email' => ['nullable','email', $existingGuard ? Rule::unique('guards', 'email')->ignore($existingGuard->id) : Rule::unique('guards', 'email')],
                        'id_number' => ['nullable','string', $existingGuard ? Rule::unique('guards', 'id_number')->ignore($existingGuard->id) : Rule::unique('guards', 'id_number')],
                        'phone' => ['nullable','string','max:20', $existingGuard ? Rule::unique('guards', 'phone')->ignore($existingGuard->id) : Rule::unique('guards', 'phone')],
                    ]);

                    if ($validatorRow->fails()) {
                        $errors[] = "Row {$rowNum}: " . implode(', ', $validatorRow->errors()->all());
                        continue;
                    }

                    if ($existingGuard) {
                        $existingGuard->fill($data);
                        $existingGuard->save();
                    } else {
                        Guard::create($data);
                    }
                    $imported++;
                } catch (\Exception $e) {
                    $errors[] = "Row {$rowNum}: " . $e->getMessage();
                }
            }

            $message = "Imported {$imported} guards successfully.";
            if (!empty($errors)) {
                $message .= " Errors: " . implode(', ', array_slice($errors, 0, 5));
                if (count($errors) > 5) {
                    $message .= " and " . (count($errors) - 5) . " more...";
                }
            }

            return back()->with('success', $message);
        } catch (\Exception $e) {
            return back()->withErrors(['file' => 'Error processing file: ' . $e->getMessage()]);
        }
    }
}
