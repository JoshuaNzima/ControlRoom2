<?php

namespace App\Http\Controllers\FrontOffice;

use App\Http\Controllers\Controller;
use App\Models\Visitor;
use App\Models\CalendarEvent;
use App\Models\FrontOfficeMessage;
use App\Models\FrontOfficeTask;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $role = $this->getFrontOfficeRole($user);

        // Get today's stats
        $todayVisitors = Visitor::whereDate('created_at', today())->count();
        $totalVisitors = Visitor::count();
        $todayEvents = CalendarEvent::whereDate('start_time', today())->count();
        $unreadMessages = FrontOfficeMessage::where('recipient_id', $user->id)
            ->whereNull('read_at')
            ->count();

        // Get recent visitors
        $recentVisitors = Visitor::with('host')
            ->whereDate('created_at', today())
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get();

        // Get today's events
        $todayCalendarEvents = CalendarEvent::with('creator')
            ->whereDate('start_time', today())
            ->orderBy('start_time')
            ->take(5)
            ->get();

        // Get pending tasks based on role
        $tasks = $this->getTasksForRole($user, $role);

        return Inertia::render('FrontOffice/Dashboard', [
            'stats' => [
                'today_visitors' => $todayVisitors,
                'pending_visitors' => $todayVisitors,
                'today_events' => $todayEvents,
                'unread_messages' => $unreadMessages,
            ],
            'recentVisitors' => $recentVisitors,
            'todayEvents' => $todayCalendarEvents,
            'tasks' => $tasks,
            'role' => $role,
            'can' => [
                'manage_calendar' => in_array($role, ['executive_assistant', 'personal_assistant', 'admin', 'super_admin']),
                'manage_tasks' => in_array($role, ['executive_assistant', 'personal_assistant', 'admin', 'super_admin']),
                'view_reports' => in_array($role, ['executive_assistant', 'admin', 'super_admin']),
                'export_data' => in_array($role, ['executive_assistant', 'admin', 'super_admin']),
            ],
        ]);
    }

    public function reports()
    {
        $user = Auth::user();
        $role = $this->getFrontOfficeRole($user);

        if (!in_array($role, ['executive_assistant', 'admin', 'super_admin'])) {
            abort(403, 'Unauthorized');
        }

        // Monthly visitor stats
        $monthlyStats = Visitor::selectRaw('DATE_FORMAT(created_at, "%Y-%m") as month, COUNT(*) as count')
            ->whereYear('created_at', now()->year)
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        // Purpose breakdown
        $purposeStats = Visitor::selectRaw('purpose, COUNT(*) as count')
            ->whereMonth('created_at', now()->month)
            ->groupBy('purpose')
            ->get();

        return Inertia::render('FrontOffice/Reports', [
            'monthlyStats' => $monthlyStats,
            'purposeStats' => $purposeStats,
            'role' => $role,
            'can' => [
                'manage_calendar' => in_array($role, ['executive_assistant', 'personal_assistant', 'admin', 'super_admin']),
                'manage_tasks' => in_array($role, ['executive_assistant', 'personal_assistant', 'admin', 'super_admin']),
                'view_reports' => in_array($role, ['executive_assistant', 'admin', 'super_admin']),
                'export_data' => in_array($role, ['executive_assistant', 'admin', 'super_admin']),
            ],
        ]);
    }

    public function visitorReports()
    {
        $user = Auth::user();
        $role = $this->getFrontOfficeRole($user);

        $visitors = Visitor::with('host')
            ->when(request('start_date'), function($q, $date) {
                $q->whereDate('created_at', '>=', $date);
            })
            ->when(request('end_date'), function($q, $date) {
                $q->whereDate('created_at', '<=', $date);
            })
            ->when(request('purpose'), function($q, $purpose) {
                $q->where('purpose', $purpose);
            })
            ->orderBy('created_at', 'desc')
            ->paginate(50)
            ->withQueryString();

        return Inertia::render('FrontOffice/VisitorReports', [
            'visitors' => $visitors,
            'filters' => request()->only(['start_date', 'end_date', 'purpose']),
            'role' => $role,
            'can' => [
                'manage_calendar' => in_array($role, ['executive_assistant', 'personal_assistant', 'admin', 'super_admin']),
                'manage_tasks' => in_array($role, ['executive_assistant', 'personal_assistant', 'admin', 'super_admin']),
                'view_reports' => in_array($role, ['executive_assistant', 'admin', 'super_admin']),
                'export_data' => in_array($role, ['executive_assistant', 'admin', 'super_admin']),
            ],
        ]);
    }

    public function export(Request $request)
    {
        $type = $request->input('type', 'visitors');

        if ($type === 'visitors') {
            $data = Visitor::with('host')
                ->when($request->start_date, fn($q, $d) => $q->whereDate('created_at', '>=', $d))
                ->when($request->end_date, fn($q, $d) => $q->whereDate('created_at', '<=', $d))
                ->orderBy('created_at', 'desc')
                ->get();

            $filename = 'visitors_' . now()->format('Y-m-d') . '.csv';

            $headers = [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            ];

            $callback = function() use ($data) {
                $file = fopen('php://output', 'w');
                fputcsv($file, ['Name', 'Company', 'Purpose', 'Host', 'Badge Number', 'Registered At']);

                foreach ($data as $visitor) {
                    fputcsv($file, [
                        $visitor->name,
                        $visitor->company,
                        $visitor->purpose,
                        $visitor->host?->name,
                        $visitor->badge_number,
                        $visitor->created_at,
                    ]);
                }

                fclose($file);
            };

            return response()->stream($callback, 200, $headers);
        }

        return back()->withError('Invalid export type');
    }

    private function getFrontOfficeRole($user): string
    {
        $roles = $user->roles->pluck('name')->toArray();

        if (in_array('executive_assistant', $roles)) {
            return 'executive_assistant';
        }
        if (in_array('receptionist', $roles)) {
            return 'receptionist';
        }
        if (in_array('personal_assistant', $roles)) {
            return 'personal_assistant';
        }
        if (in_array('super_admin', $roles)) {
            return 'super_admin';
        }
        if (in_array('admin', $roles)) {
            return 'admin';
        }

        return 'receptionist';
    }

    private function getTasksForRole($user, $role)
    {
        $query = FrontOfficeTask::query();

        if ($role === 'executive_assistant') {
            // Executive assistant sees all front office tasks
            $query->whereIn('category', ['front_office', 'executive', 'general']);
        } elseif ($role === 'personal_assistant') {
            // Personal assistant sees tasks for assigned executives
            $query->where(function($q) use ($user) {
                $q->where('assigned_to', $user->id)
                  ->orWhere('created_by', $user->id);
            });
        } else {
            // Receptionist sees only general front office tasks
            $query->where('category', 'front_office');
        }

        return $query->where('status', '!=', 'completed')
            ->orderBy('due_date')
            ->take(5)
            ->get();
    }
}
