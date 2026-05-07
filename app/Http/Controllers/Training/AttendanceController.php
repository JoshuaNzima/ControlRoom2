<?php

namespace App\Http\Controllers\Training;

use App\Http\Controllers\Controller;
use App\Models\Training\Trainee;
use App\Models\Training\TraineeAttendance;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;

class AttendanceController extends Controller
{
    public function index(Request $request): Response
    {
        $date = $request->input('date', today()->toDateString());
        $traineeId = $request->input('trainee_id');

        $trainees = Trainee::with(['attendance' => function ($q) use ($date) {
            $q->whereDate('date', $date);
        }])
            ->whereIn('status', ['in_training', 'pending'])
            ->orderBy('name')
            ->get();

        $attendanceSummary = TraineeAttendance::whereBetween('date', [
            Carbon::parse($date)->startOfMonth(),
            Carbon::parse($date)->endOfMonth()
        ])
            ->selectRaw('trainee_id, status, COUNT(*) as count')
            ->groupBy('trainee_id', 'status')
            ->get();

        $history = [];
        if ($traineeId) {
            $history = TraineeAttendance::where('trainee_id', $traineeId)
                ->whereBetween('date', [Carbon::parse($date)->subDays(30), $date])
                ->with('recorder:id,name')
                ->orderBy('date', 'desc')
                ->get();
        }

        return Inertia::render('Training/Attendance/Index', [
            'trainees' => $trainees,
            'summary' => $attendanceSummary,
            'history' => $history,
            'filters' => [
                'date' => $date,
                'trainee_id' => $traineeId,
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'trainee_id' => ['required', 'exists:training_trainees,id'],
            'date' => ['required', 'date'],
            'check_in_time' => ['nullable', 'date_format:H:i'],
            'check_out_time' => ['nullable', 'date_format:H:i'],
            'status' => ['required', 'in:present,absent,late,excused'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $validated['recorded_by'] = auth()->id();

        $attendance = TraineeAttendance::updateOrCreate(
            [
                'trainee_id' => $validated['trainee_id'],
                'date' => $validated['date'],
            ],
            $validated
        );

        return response()->json([
            'success' => true,
            'message' => 'Attendance recorded successfully',
            'attendance' => $attendance,
        ]);
    }

    public function bulkStore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'date' => ['required', 'date'],
            'attendances' => ['required', 'array'],
            'attendances.*.trainee_id' => ['required', 'exists:training_trainees,id'],
            'attendances.*.status' => ['required', 'in:present,absent,late,excused'],
            'attendances.*.check_in_time' => ['nullable', 'date_format:H:i'],
            'attendances.*.check_out_time' => ['nullable', 'date_format:H:i'],
            'attendances.*.notes' => ['nullable', 'string', 'max:500'],
        ]);

        $date = $validated['date'];
        $recordedBy = auth()->id();

        foreach ($validated['attendances'] as $attendance) {
            TraineeAttendance::updateOrCreate(
                [
                    'trainee_id' => $attendance['trainee_id'],
                    'date' => $date,
                ],
                [
                    'status' => $attendance['status'],
                    'check_in_time' => $attendance['check_in_time'] ?? null,
                    'check_out_time' => $attendance['check_out_time'] ?? null,
                    'notes' => $attendance['notes'] ?? null,
                    'recorded_by' => $recordedBy,
                ]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Bulk attendance recorded successfully',
        ]);
    }

    public function report(Request $request): Response
    {
        $startDate = $request->input('start_date', today()->subDays(30)->toDateString());
        $endDate = $request->input('end_date', today()->toDateString());
        $traineeId = $request->input('trainee_id');

        $query = TraineeAttendance::with(['trainee:id,name', 'recorder:id,name'])
            ->whereBetween('date', [$startDate, $endDate]);

        if ($traineeId) {
            $query->where('trainee_id', $traineeId);
        }

        $attendanceRecords = $query->orderBy('date', 'desc')->paginate(50)->withQueryString();

        $summary = TraineeAttendance::whereBetween('date', [$startDate, $endDate])
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        return Inertia::render('Training/Attendance/Report', [
            'records' => $attendanceRecords,
            'summary' => $summary,
            'trainees' => Trainee::orderBy('name')->get(['id', 'name']),
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'trainee_id' => $traineeId,
            ],
        ]);
    }

    public function traineeHistory(Request $request, Trainee $trainee): JsonResponse
    {
        $startDate = $request->input('start_date', today()->subDays(90)->toDateString());
        $endDate = $request->input('end_date', today()->toDateString());

        $attendance = TraineeAttendance::where('trainee_id', $trainee->id)
            ->whereBetween('date', [$startDate, $endDate])
            ->with('recorder:id,name')
            ->orderBy('date', 'desc')
            ->get();

        $summary = [
            'present' => $attendance->where('status', 'present')->count(),
            'absent' => $attendance->where('status', 'absent')->count(),
            'late' => $attendance->where('status', 'late')->count(),
            'excused' => $attendance->where('status', 'excused')->count(),
            'total' => $attendance->count(),
        ];

        return response()->json([
            'success' => true,
            'attendance' => $attendance,
            'summary' => $summary,
        ]);
    }
}
