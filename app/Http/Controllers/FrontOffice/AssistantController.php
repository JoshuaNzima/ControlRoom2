<?php

namespace App\Http\Controllers\FrontOffice;

use App\Http\Controllers\Controller;
use App\Models\FrontOffice\OfficeDuty;
use App\Models\FrontOffice\PersonalDuty;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AssistantController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // Get stats for both office and personal duties
        $officeStats = [
            'calendar_events_today' => OfficeDuty::where('user_id', $user->id)
                ->where('duty_type', 'calendar_schedule')
                ->whereDate('scheduled_start', today())
                ->count(),
            'pending_communications' => OfficeDuty::where('user_id', $user->id)
                ->where('duty_type', 'communication')
                ->whereIn('status', ['pending', 'in_progress'])
                ->count(),
            'upcoming_meetings' => OfficeDuty::where('user_id', $user->id)
                ->where('duty_type', 'meeting_coordination')
                ->where('scheduled_start', '>=', now())
                ->where('scheduled_start', '<=', now()->addDays(7))
                ->count(),
            'pending_reports' => OfficeDuty::where('user_id', $user->id)
                ->where('duty_type', 'report_document')
                ->whereIn('status', ['pending', 'in_progress'])
                ->count(),
            'petty_cash_pending' => OfficeDuty::where('user_id', $user->id)
                ->where('duty_type', 'petty_cash')
                ->whereNull('expense_id')
                ->whereNotNull('petty_cash_amount')
                ->count(),
            'events_this_week' => OfficeDuty::where('user_id', $user->id)
                ->where('duty_type', 'event_planning')
                ->whereBetween('scheduled_start', [now(), now()->addDays(7)])
                ->count(),
        ];

        $personalStats = [
            'diary_entries_today' => PersonalDuty::where('user_id', $user->id)
                ->where('duty_type', 'diary_management')
                ->whereDate('scheduled_start', today())
                ->count(),
            'pending_calls' => PersonalDuty::where('user_id', $user->id)
                ->where('duty_type', 'calls_messages')
                ->whereIn('status', ['pending', 'in_progress'])
                ->count(),
            'upcoming_travel' => PersonalDuty::where('user_id', $user->id)
                ->where('duty_type', 'travel_transport')
                ->where('scheduled_start', '>=', now())
                ->count(),
            'pending_errands' => PersonalDuty::where('user_id', $user->id)
                ->where('duty_type', 'personal_errands')
                ->whereIn('status', ['pending', 'in_progress'])
                ->count(),
            'documents_to_file' => PersonalDuty::where('user_id', $user->id)
                ->where('duty_type', 'document_organization')
                ->whereIn('status', ['pending', 'in_progress'])
                ->count(),
            'upcoming_reminders' => PersonalDuty::where('user_id', $user->id)
                ->where('duty_type', 'reminders_followups')
                ->where('reminder_time', '>=', now())
                ->where('reminder_time', '<=', now()->addDays(7))
                ->count(),
        ];

        return Inertia::render('FrontOffice/Assistant', [
            'stats' => array_merge($officeStats, $personalStats, [
                'total_office_duties' => OfficeDuty::where('user_id', $user->id)->count(),
                'total_personal_duties' => PersonalDuty::where('user_id', $user->id)->count(),
            ]),
        ]);
    }
}
