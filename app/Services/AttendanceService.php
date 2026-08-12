<?php

namespace App\Services;

use App\Models\Guards\Attendance;
use App\Models\Guards\Guard;
use App\Models\Setting;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Handles attendance check-in, check-out, bulk operations, and manual attendance.
 *
 * Extracted from SupervisorController so that Control Room and Zone Commander
 * controllers can reuse the same attendance logic without duplication.
 */
class AttendanceService
{
    public function __construct(
        private readonly SiteScanLockService $siteScanLockService,
    ) {}

    /**
     * Check in a single guard.
     *
     * @throws \App\Exceptions\AttendanceException on business rule violation
     * @return array{success: string, attendance_id: int}
     */
    public function checkIn(Request $request): array
    {
        $validated = $request->validate([
            'guard_id' => 'required|exists:guards,id',
            'client_site_id' => 'nullable|exists:client_sites,id',
            'notes' => 'nullable|string',
            'time' => 'nullable|date_format:H:i',
            'photo' => 'nullable|image|max:5120',
            'backdate' => 'nullable|boolean',
            'backdate_reason' => 'nullable|string|min:10|max:255',
        ]);

        $guard = Guard::findOrFail($validated['guard_id']);
        $this->validateGuardCanAttend($guard);

        $siteId = $this->resolveSiteId($validated);
        $this->enforceSiteScanLock($siteId, $validated);

        [$date, $backdateRequested] = $this->resolveBackdate($request);

        // Check for existing attendance on the target date
        $existingAttendance = Attendance::where('guard_id', $validated['guard_id'])
            ->whereDate('date', $date)
            ->first();

        if ($existingAttendance && $existingAttendance->check_in_time) {
            throw \App\Exceptions\AttendanceException::withMessage('Guard has already checked in today');
        }

        $checkInTime = $this->resolveCheckTime($date, $request->input('time'));

        $backdateReason = $validated['backdate_reason'] ?? null;
        $source = $backdateRequested ? 'supervisor_backdate' : 'supervisor_manual';

        $attendance = $this->persistCheckIn(
            $existingAttendance,
            $validated['guard_id'],
            $siteId,
            $date,
            $checkInTime,
            $request->input('notes'),
            $backdateRequested,
            $backdateReason,
            $source,
            $request
        );

        return ['success' => 'Guard checked in successfully', 'attendance_id' => $attendance->id];
    }

    /**
     * Check out a single guard.
     *
     * @throws \App\Exceptions\AttendanceException on business rule violation
     * @return array{success: string}
     */
    public function checkOut(Request $request): array
    {
        $validated = $request->validate([
            'guard_id' => 'required|exists:guards,id',
            'notes' => 'nullable|string',
            'time' => 'nullable|date_format:H:i',
            'photo' => 'nullable|image|max:5120',
        ]);

        $attendance = Attendance::where('guard_id', $validated['guard_id'])
            ->whereDate('date', Carbon::today())
            ->whereNull('check_out_time')
            ->first();

        if (!$attendance || !$attendance->check_in_time) {
            throw \App\Exceptions\AttendanceException::withMessage('No active check-in found for this guard');
        }

        $checkOutTime = $request->input('time')
            ? Carbon::parse(Carbon::today()->format('Y-m-d') . ' ' . $request->input('time'))
            : now();

        $attendance->check_out_time = $checkOutTime;
        $attendance->check_out_notes = $validated['notes'];

        if ($request->hasFile('photo')) {
            $attendance->check_out_photo = $request->file('photo')->store('attendance/' . now()->format('Y-m-d'), 'public');
        }

        $attendance->save();

        return ['success' => 'Guard checked out successfully'];
    }

    /**
     * Bulk check-in for multiple guards.
     *
     * @throws \App\Exceptions\AttendanceException on validation failures
     * @return array{success: string, success_count: int, error_count: int}
     */
    public function bulkCheckIn(Request $request): array
    {
        $validated = $request->validate([
            'guard_ids' => 'required|string',
            'client_site_id' => 'nullable|exists:client_sites,id',
            'notes' => 'nullable|string',
            'time' => 'nullable|date_format:H:i',
            'photo' => 'nullable|image|max:5120',
            'backdate' => 'nullable|boolean',
            'backdate_reason' => 'nullable|string|min:10|max:255',
        ]);

        $guardIds = json_decode($validated['guard_ids'], true);
        if (!is_array($guardIds) || empty($guardIds)) {
            throw \App\Exceptions\AttendanceException::withMessage('No guards selected for bulk check-in.');
        }

        $siteId = $this->resolveSiteId($validated);
        $this->enforceSiteScanLock($siteId, $validated);

        [$date, $backdateRequested] = $this->resolveBackdate($request);
        $checkInTime = $this->resolveCheckTime($date, $request->input('time'));
        $backdateReason = $validated['backdate_reason'] ?? null;
        $source = $backdateRequested ? 'supervisor_backdate' : 'supervisor_bulk';

        $successCount = 0;
        $errorCount = 0;

        foreach ($guardIds as $guardId) {
            $guard = Guard::find($guardId);
            if (!$guard || in_array($guard->status, ['dismissed', 'absconded'], true)) {
                $errorCount++;
                continue;
            }

            $existingAttendance = Attendance::where('guard_id', $guardId)
                ->whereDate('date', $date)
                ->first();

            if ($existingAttendance && $existingAttendance->check_in_time) {
                $errorCount++;
                continue;
            }

            $this->persistCheckIn(
                $existingAttendance,
                $guardId,
                $siteId,
                $date,
                $checkInTime,
                $request->input('notes'),
                $backdateRequested,
                $backdateReason,
                $source,
                $request
            );

            $successCount++;
        }

        $message = "Bulk check-in complete: {$successCount} succeeded";
        if ($errorCount > 0) {
            $message .= ", {$errorCount} skipped (already checked in or invalid)";
        }

        return ['success' => $message, 'success_count' => $successCount, 'error_count' => $errorCount];
    }

    /**
     * Bulk check-out for multiple guards.
     *
     * @throws \App\Exceptions\AttendanceException on validation failures
     * @return array{success: string, success_count: int, error_count: int}
     */
    public function bulkCheckOut(Request $request): array
    {
        $validated = $request->validate([
            'guard_ids' => 'required|string',
            'notes' => 'nullable|string',
            'time' => 'nullable|date_format:H:i',
            'photo' => 'nullable|image|max:5120',
        ]);

        $guardIds = json_decode($validated['guard_ids'], true);
        if (!is_array($guardIds) || empty($guardIds)) {
            throw \App\Exceptions\AttendanceException::withMessage('No guards selected for bulk check-out.');
        }

        $checkOutTime = $request->input('time')
            ? Carbon::parse(Carbon::today()->format('Y-m-d') . ' ' . $request->input('time'))
            : now();

        $successCount = 0;
        $errorCount = 0;

        foreach ($guardIds as $guardId) {
            $attendance = Attendance::where('guard_id', $guardId)
                ->whereDate('date', Carbon::today())
                ->whereNull('check_out_time')
                ->first();

            if (!$attendance || !$attendance->check_in_time) {
                $errorCount++;
                continue;
            }

            $attendance->check_out_time = $checkOutTime;
            $attendance->check_out_notes = $validated['notes'];
            if ($request->hasFile('photo')) {
                $attendance->check_out_photo = $request->file('photo')->store('attendance/' . now()->format('Y-m-d'), 'public');
            }
            $attendance->save();
            $successCount++;
        }

        $message = "Bulk check-out complete: {$successCount} succeeded";
        if ($errorCount > 0) {
            $message .= ", {$errorCount} skipped (not checked in or already out)";
        }

        return ['success' => $message, 'success_count' => $successCount, 'error_count' => $errorCount];
    }

    /**
     * Record manual attendance for a guard (non-today dates, comprehensive fields).
     *
     * @throws \App\Exceptions\AttendanceException on business rule violation
     * @return array{success: string}
     */
    public function manualAttendance(Request $request): array
    {
        $validated = $request->validate([
            'guard_id' => 'required|exists:guards,id',
            'client_site_id' => 'required|exists:client_sites,id',
            'date' => 'required|date',
            'check_in_time' => 'required|date_format:H:i',
            'check_out_time' => 'nullable|date_format:H:i|after:check_in_time',
            'status' => 'required|in:present,late,absent,half_day',
            'notes' => 'nullable|string',
        ]);

        $guard = Guard::findOrFail($validated['guard_id']);
        $this->validateGuardCanAttend($guard);

        $date = Carbon::parse($validated['date']);
        $checkInTime = Carbon::parse($validated['date'] . ' ' . $validated['check_in_time']);
        $checkOutTime = $validated['check_out_time']
            ? Carbon::parse($validated['date'] . ' ' . $validated['check_out_time'])
            : null;

        $existingAttendance = Attendance::where('guard_id', $validated['guard_id'])
            ->whereDate('date', $date)
            ->first();

        if ($existingAttendance) {
            throw \App\Exceptions\AttendanceException::withMessage('Guard already has an attendance record for this date');
        }

        $attendance = new Attendance([
            'guard_id' => $validated['guard_id'],
            'supervisor_id' => Auth::id(),
            'client_site_id' => $validated['client_site_id'],
            'date' => $date,
            'check_in_time' => $checkInTime,
            'check_out_time' => $checkOutTime,
            'check_in_notes' => $validated['notes'],
            'status' => $validated['status'],
        ]);

        $attendance->save();

        return ['success' => 'Manual attendance recorded successfully'];
    }

    // -------------------------------------------------------------------
    //  Private helpers
    // -------------------------------------------------------------------

    /**
     * Validate that a guard is not dismissed or absconded.
     *
     * @throws \App\Exceptions\AttendanceException
     */
    private function validateGuardCanAttend(Guard $guard): void
    {
        if (!in_array($guard->status, ['dismissed', 'absconded'], true)) {
            return;
        }

        $message = match ($guard->status) {
            'dismissed' => 'This guard has been dismissed. Please contact HR at hr@coinsec.co.zw or visit the HR module to process a reinstatement before taking attendance.',
            'absconded' => 'This guard has been marked as absconded. Please contact HR at hr@coinsec.co.zw or visit the HR module to update their status before taking attendance.',
            default => 'Cannot record attendance. Contact HR for assistance (hr@coinsec.co.zw).',
        };

        throw \App\Exceptions\AttendanceException::validationError('guard_id', $message);
    }

    /**
     * Resolve the site ID: prefer payload, then fall back to the active scan lock.
     */
    private function resolveSiteId(array $validated): ?int
    {
        $scan = $this->siteScanLockService->getActiveLock(Auth::id());
        return $validated['client_site_id'] ?? ($scan['site_id'] ?? null);
    }

    /**
     * Enforce site scan lock if required by settings.
     *
     * @throws \App\Exceptions\AttendanceException
     */
    private function enforceSiteScanLock(?int $siteId, array $validated): void
    {
        if (app()->environment('testing')) {
            return;
        }

        if (!Setting::requireSiteScan()) {
            return;
        }

        if (!$siteId) {
            throw \App\Exceptions\AttendanceException::withMessage('Scan the site QR/checkpoint first to lock the site for attendance.');
        }

        if ($validated['client_site_id'] && (int)$validated['client_site_id'] !== (int)$siteId) {
            throw \App\Exceptions\AttendanceException::withMessage('Selected site does not match the active site lock.');
        }
    }

    /**
     * Handle backdate logic: validate cutoff/max days, return resolved date.
     *
     * @throws \App\Exceptions\AttendanceException
     * @return array{Carbon\Carbon, bool} [date, isBackdated]
     */
    private function resolveBackdate(Request $request): array
    {
        $backdateRequested = (bool) $request->input('backdate', false);
        $date = Carbon::today();

        if (!$backdateRequested || !config('attendance.backdate.enabled', true)) {
            return [$date, false];
        }

        $cutoff = config('attendance.backdate.cutoff', '06:00');
        $cutoffTime = Carbon::today()->setTimeFromTimeString($cutoff);

        if (now()->greaterThan($cutoffTime)) {
            throw \App\Exceptions\AttendanceException::withMessage('Backdating is only allowed until ' . $cutoff . ' for the previous day.');
        }

        $maxDays = (int) config('attendance.backdate.max_days', 1);
        if ($maxDays < 1) {
            throw \App\Exceptions\AttendanceException::withMessage('Backdating is currently disabled.');
        }

        return [Carbon::yesterday(), true];
    }

    /**
     * Resolve the check-in time from the request.
     */
    private function resolveCheckTime(Carbon $date, ?string $timeInput): Carbon
    {
        if ($timeInput) {
            return Carbon::parse($date->format('Y-m-d') . ' ' . $timeInput);
        }
        return now();
    }

    /**
     * Persist a check-in record — handles both new attendance and updating existing.
     *
     * @return \App\Models\Guards\Attendance
     */
    private function persistCheckIn(
        ?Attendance $existing,
        int $guardId,
        ?int $siteId,
        Carbon $date,
        Carbon $checkInTime,
        ?string $notes,
        bool $backdateRequested,
        ?string $backdateReason,
        string $defaultSource,
        Request $request,
    ): Attendance {
        $status = $checkInTime->hour > 8 ? 'late' : 'present';
        $source = $backdateRequested ? 'supervisor_backdate' : $defaultSource;

        if ($existing && !$existing->check_in_time) {
            $attendance = $existing;
            $attendance->supervisor_id = Auth::id();
            $attendance->client_site_id = $siteId;
            $attendance->check_in_time = $checkInTime;
            $attendance->check_in_notes = trim(($attendance->check_in_notes ?: '') . ($notes ? ' ' . $notes : ''));
            $attendance->status = $status;
            $attendance->backdated = $backdateRequested;
            $attendance->backdated_reason = $backdateRequested ? $backdateReason : null;
            $attendance->source = $source;

            if ($request->hasFile('photo')) {
                $attendance->check_in_photo = $request->file('photo')->store('attendance/' . now()->format('Y-m-d'), 'public');
            }

            $attendance->save();
            return $attendance;
        }

        $attendance = new Attendance([
            'guard_id' => $guardId,
            'supervisor_id' => Auth::id(),
            'client_site_id' => $siteId,
            'date' => $date,
            'check_in_time' => $checkInTime,
            'check_in_notes' => $notes,
            'status' => $status,
            'backdated' => $backdateRequested,
            'backdated_reason' => $backdateRequested ? $backdateReason : null,
            'source' => $source,
        ]);

        if ($request->hasFile('photo')) {
            $attendance->check_in_photo = $request->file('photo')->store('attendance/' . now()->format('Y-m-d'), 'public');
        }

        $attendance->save();
        return $attendance;
    }
}
