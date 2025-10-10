<?php

namespace App\Http\Controllers;

use App\Models\Guards\{Attendance, Guard, ClientSite};
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AttendanceController extends Controller
{
    public function index(Request $request)
    {
        $query = Attendance::with(['guardRelation', 'supervisor', 'clientSite'])
            ->when($request->date, function ($query, $date) {
                $query->whereDate('date', $date);
            })
            ->when($request->status, function ($query, $status) {
                $query->where('status', $status);
            })
            ->when($request->search, function ($query, $search) {
                $query->whereHas('guardRelation', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('employee_id', 'like', "%{$search}%");
                });
            });

        // If user is supervisor, only show their guards' attendance
        $user = Auth::user();
        if ($user->roles->contains('name', 'supervisor')) {
            $query->whereHas('guardRelation', function($q) use ($user) {
                $q->where('supervisor_id', $user->id);
            });
        }

        $attendance = $query->latest('date')->paginate(20)
            ->through(fn ($record) => [
                ...$record->toArray(),
                'guard' => $record->guardRelation,
                'supervisor' => $record->supervisor,
                'client_site' => $record->clientSite
            ]);

        return Inertia::render('Attendance/Index', [
            'attendance' => $attendance,
            'filters' => $request->only(['search', 'date', 'status']),
            'stats' => $this->getAttendanceStats(),
        ]);
    }

    public function create()
    {
        $user = Auth::user();
        $guards = Guard::when($user->roles->contains('name', 'supervisor'), function($query) use ($user) {
                $query->where('supervisor_id', $user->id);
            })
            ->where('status', 'active')
            ->get();

        $sites = ClientSite::active()->get();

        return Inertia::render('Attendance/Create', [
            'guards' => $guards,
            'sites' => $sites,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'guard_id' => 'required|exists:guards,id',
            'client_site_id' => 'required|exists:client_sites,id',
            'date' => 'required|date',
            'check_in_time' => 'required|date_format:H:i',
            'check_out_time' => 'nullable|date_format:H:i|after:check_in_time',
            'status' => 'required|in:present,absent,late,half_day,leave',
            'check_in_notes' => 'nullable|string',
            'check_out_notes' => 'nullable|string',
        ]);

        // Combine date and times
        $checkInDateTime = Carbon::parse($validated['date'].' '.$validated['check_in_time']);
        $checkOutDateTime = $validated['check_out_time'] 
            ? Carbon::parse($validated['date'].' '.$validated['check_out_time'])
            : null;

        $attendance = Attendance::create([
            'guard_id' => $validated['guard_id'],
            'supervisor_id' => Auth::id(),
            'client_site_id' => $validated['client_site_id'],
            'date' => $validated['date'],
            'check_in_time' => $checkInDateTime,
            'check_out_time' => $checkOutDateTime,
            'status' => $validated['status'],
            'check_in_notes' => $validated['check_in_notes'] ?? null,
            'check_out_notes' => $validated['check_out_notes'] ?? null,
        ]);

        if ($checkOutDateTime) {
            $attendance->calculateHours();
        }

        return redirect()->route('attendance.index')
            ->with('success', 'Attendance record created successfully.');
    }

    public function edit(Attendance $attendance)
    {
        $user = Auth::user();
        $guards = Guard::when($user->roles->contains('name', 'supervisor'), function($query) use ($user) {
                $query->where('supervisor_id', $user->id);
            })
            ->where('status', 'active')
            ->get();

        $sites = ClientSite::active()->get();

        return Inertia::render('Attendance/Edit', [
            'attendance' => $attendance->load(['guard', 'clientSite']),
            'guards' => $guards,
            'sites' => $sites,
        ]);
    }

    public function update(Request $request, Attendance $attendance)
    {
        $validated = $request->validate([
            'guard_id' => 'required|exists:guards,id',
            'client_site_id' => 'required|exists:client_sites,id',
            'date' => 'required|date',
            'check_in_time' => 'required|date_format:H:i',
            'check_out_time' => 'nullable|date_format:H:i|after:check_in_time',
            'status' => 'required|in:present,absent,late,half_day,leave',
            'check_in_notes' => 'nullable|string',
            'check_out_notes' => 'nullable|string',
        ]);

        // Combine date and times
        $checkInDateTime = Carbon::parse($validated['date'].' '.$validated['check_in_time']);
        $checkOutDateTime = $validated['check_out_time'] 
            ? Carbon::parse($validated['date'].' '.$validated['check_out_time'])
            : null;

        $attendance->update([
            'guard_id' => $validated['guard_id'],
            'client_site_id' => $validated['client_site_id'],
            'date' => $validated['date'],
            'check_in_time' => $checkInDateTime,
            'check_out_time' => $checkOutDateTime,
            'status' => $validated['status'],
            'check_in_notes' => $validated['check_in_notes'] ?? null,
            'check_out_notes' => $validated['check_out_notes'] ?? null,
        ]);

        if ($checkOutDateTime) {
            $attendance->calculateHours();
        }

        return redirect()->route('attendance.index')
            ->with('success', 'Attendance record updated successfully.');
    }

    public function destroy(Attendance $attendance)
    {
        $attendance->delete();

        return redirect()->route('attendance.index')
            ->with('success', 'Attendance record deleted successfully.');
    }

    private function getAttendanceStats()
    {
        $date = request('date', today());
        $guardQuery = Guard::where('status', 'active');
        
        $user = Auth::user();
        if ($user->roles->contains('name', 'supervisor')) {
            $guardQuery->where('supervisor_id', $user->id);
        }

        $totalGuards = $guardQuery->count();
        $presentGuards = Attendance::whereDate('date', $date)
            ->whereIn('status', ['present', 'late'])
            ->count();

        return [
            'total' => $totalGuards,
            'present' => $presentGuards,
            'absent' => $totalGuards - $presentGuards,
            'on_duty' => Attendance::whereDate('date', $date)
                ->whereNotNull('check_in_time')
                ->whereNull('check_out_time')
                ->count(),
            'completed' => Attendance::whereDate('date', $date)
                ->whereNotNull('check_in_time')
                ->whereNotNull('check_out_time')
                ->count(),
        ];
    }
}
