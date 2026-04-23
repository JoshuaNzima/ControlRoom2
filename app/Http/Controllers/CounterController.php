<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Requisition;
use App\Models\Approval;
use App\Models\Expense;
use App\Models\Ticket;
use App\Models\Incident;
use App\Models\Flag;
use App\Models\Down;
use App\Models\Alert;
use App\Models\AssetHandover;
use App\Models\BudgetRequest;
use App\Models\Task;
use App\Models\RequisitionBatch;
use App\Models\Guards\Attendance;
use App\Models\Guards\GuardAssignment;
use App\Models\ChatSession;

class CounterController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
		$today = now()->toDateString();

        $notificationsUnread = $user->unreadNotifications()->count();

        $requisitionsMyOpen = Requisition::where('requested_by', $user->id)
            ->whereIn('status', ['pending_admin', 'needs_revision', 'pending_disbursement', 'pending_funding'])
            ->count();
        $requisitionsNeedsRevision = Requisition::where('requested_by', $user->id)
            ->where('status', 'needs_revision')
            ->count();
        $requisitionsPendingAdmin = $user->hasAnyRole(['admin', 'super_admin'])
            ? Requisition::where('status', 'pending_admin')->count()
            : 0;
        $requisitionsPendingDisbursement = $user->hasAnyRole(['asset_manager', 'assets_manager', 'super_admin'])
            ? Requisition::where('status', 'pending_disbursement')->count()
            : 0;
        $requisitionBatchesPendingAck = $user->hasAnyRole(['admin', 'super_admin'])
            ? RequisitionBatch::where('status', 'pending_ack')->count()
            : 0;

        $financeApprovalsPending = Approval::pendingForUser($user->id)->count();
        $financeExpensesPendingMine = Expense::where('user_id', $user->id)->where('status', 'pending')->count();

        // Budget Requests counters
        $budgetsMyOpen = BudgetRequest::where('requested_by', $user->id)
            ->whereIn('status', ['pending_admin', 'needs_revision', 'pending_release'])
            ->count();
        $budgetsNeedsRevision = BudgetRequest::where('requested_by', $user->id)
            ->where('status', 'needs_revision')
            ->count();
        $budgetsPendingAdmin = $user->hasAnyRole(['admin', 'super_admin'])
            ? BudgetRequest::where('status', 'pending_admin')->count()
            : 0;
        $budgetsPendingRelease = $user->hasAnyRole(['finance_officer','accountant','finance','accounting','super_admin'])
            ? BudgetRequest::where('status', 'pending_release')->count()
            : 0;

        $controlTicketsOpen = Ticket::whereIn('status', ['open', 'in_progress', 'pending'])->count();
        $controlIncidentsOpen = Incident::whereNull('resolved_at')->count();
        $controlFlagsPending = Flag::where('status', 'pending_review')->count();
        $controlDownsActive = Down::whereNull('resolved_at')->count();
        $alertsActive = Alert::whereNull('resolved_at')->count();

		$downsOpen = (int) Down::where('status', 'open')->count();
		$downsEscalated = (int) Down::where('status', 'escalated')->count();
		$downsResolvedToday = (int) Down::where('status', 'resolved')->whereDate('resolved_at', $today)->count();

		$attendanceAbsentToday = (int) Attendance::whereDate('date', $today)->where('status', 'absent')->count();
		$attendanceCoveredToday = (int) Attendance::whereDate('date', $today)->where('status', 'covered')->count();
		$attendanceCheckedInToday = (int) Attendance::whereDate('date', $today)
			->whereNotNull('check_in_time')
			->distinct('guard_id')
			->count('guard_id');

		$deploymentsToday = (int) GuardAssignment::whereDate('created_at', $today)->count();

        $assetsHandoversOutstanding = AssetHandover::whereNull('returned_at')->count();

        // Task counters
        $tasksMyOpen = Task::where('assigned_to', $user->id)
            ->whereIn('status', ['pending', 'in_progress'])
            ->count();
        $tasksMyOverdue = Task::where('assigned_to', $user->id)
            ->whereIn('status', ['pending', 'in_progress'])
            ->whereNotNull('due_date')
            ->where('due_date', '<', now()->toDateString())
            ->count();

        // Chat transfer requests (for control room operators, admins, super_admins)
        $chatTransfersPending = $user->hasAnyRole(['control_room_operator', 'admin', 'super_admin'])
            ? ChatSession::where('status', ChatSession::STATUS_PENDING_TRANSFER)->count()
            : 0;

        return response()->json([
            'notifications_unread' => $notificationsUnread,
            'requisitions_my_open' => $requisitionsMyOpen,
            'requisitions_needs_revision' => $requisitionsNeedsRevision,
            'requisitions_pending_admin' => $requisitionsPendingAdmin,
            'requisitions_pending_disbursement' => $requisitionsPendingDisbursement,
            'requisition_batches_pending_ack' => $requisitionBatchesPendingAck,
            'finance_approvals_pending' => $financeApprovalsPending,
            'finance_expenses_pending_mine' => $financeExpensesPendingMine,
            'budgets_my_open' => $budgetsMyOpen,
            'budgets_needs_revision' => $budgetsNeedsRevision,
            'budgets_pending_admin' => $budgetsPendingAdmin,
            'budgets_pending_release' => $budgetsPendingRelease,
            'control_tickets_open' => $controlTicketsOpen,
            'control_incidents_open' => $controlIncidentsOpen,
            'control_flags_pending' => $controlFlagsPending,
            'control_downs_active' => $controlDownsActive,
            'alerts_active' => $alertsActive,
            'downs_open' => $downsOpen,
            'downs_escalated' => $downsEscalated,
            'downs_resolved_today' => $downsResolvedToday,
            'attendance_absent_today' => $attendanceAbsentToday,
            'attendance_covered_today' => $attendanceCoveredToday,
            'attendance_checked_in_today' => $attendanceCheckedInToday,
            'deployments_today' => $deploymentsToday,
            'assets_handovers_outstanding' => $assetsHandoversOutstanding,
            'tasks_my_open' => $tasksMyOpen,
            'tasks_my_overdue' => $tasksMyOverdue,
            'chat_transfers_pending' => $chatTransfersPending,
        ]);
    }
}
