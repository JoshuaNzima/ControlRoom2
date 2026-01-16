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
use App\Models\RequisitionBatch;

class CounterController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

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

        $assetsHandoversOutstanding = AssetHandover::whereNull('returned_at')->count();

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
            'assets_handovers_outstanding' => $assetsHandoversOutstanding,
        ]);
    }
}
