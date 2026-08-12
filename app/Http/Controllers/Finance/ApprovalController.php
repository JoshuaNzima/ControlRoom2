<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Models\Approval;
use App\Models\Expense;
use App\Models\Requisition;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class ApprovalController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $approvals = Approval::with(['expense', 'approver'])
            ->pendingForUser($user->id)
            ->orderBy('stage')
            ->get();

        // Requisitions filtering for Admin Approvals page
        $reqFilter = request()->input('req_filter', 'pending'); // pending|expired
        $requisitionsPending = Requisition::query()
            ->when(!$user->hasAnyRole(['admin','super_admin']), fn($q) => $q->whereRaw('1=0'))
            ->where('status', 'pending_admin')
            ->with('requestedBy')
            ->orderByDesc('created_at')
            ->limit(100)
            ->get();

        $requisitionsExpired = Requisition::query()
            ->when(!$user->hasAnyRole(['admin','super_admin']), fn($q) => $q->whereRaw('1=0'))
            ->where('status', 'expired')
            ->with('requestedBy')
            ->orderByDesc('updated_at')
            ->limit(100)
            ->get();

        $budgets = \App\Models\Budget::query()
            ->with('user')
            ->orderBy('fiscal_year', 'desc')
            ->orderBy('fiscal_month', 'desc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Admin/Approvals/Index', [
            'approvals' => $approvals,
            'budgets' => $budgets,
            'requisitionsPending' => $requisitionsPending,
            'requisitionsExpired' => $requisitionsExpired,
            'selectedTab' => request()->input('tab', 'requisitions'),
            'reqFilter' => $reqFilter,
        ]);
    }

    public function show(Approval $approval)
    {
        $this->authorize('view', $approval);

        $approval->load('expense', 'approver');

        if (request()->wantsJson() || request()->ajax()) {
            return response()->json($approval);
        }

        return Inertia::render('Admin/Approvals/Show', [
            'approval' => $approval,
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', Approval::class);

        $data = $request->validate([
            'expense_id' => 'required|exists:expenses,id',
            'approver_id' => 'required|exists:users,id',
            'stage' => 'nullable|integer|min:1',
            'comments' => 'nullable|string',
        ]);

        $approval = Approval::create(array_merge($data, ['status' => 'pending']));

        return redirect()->route('finance.approvals.index')->withSuccess('Approval created');
    }

    public function approve(Approval $approval, Request $request)
    {
        $this->authorize('approve', $approval);

        $approval->update([
            'status' => 'approved',
            'comments' => $request->input('comments'),
        ]);

        // If this is the final stage, mark the expense approved
        $maxStage = Approval::where('expense_id', $approval->expense_id)->max('stage');
        if ($approval->stage >= $maxStage) {
            $expense = Expense::find($approval->expense_id);
            if ($expense) {
                $expense->update(['status' => 'approved']);
            }
        }

        return back()->withSuccess('Approved');
    }

    public function reject(Approval $approval, Request $request)
    {
        $this->authorize('reject', $approval);

        $approval->update([
            'status' => 'rejected',
            'comments' => $request->input('comments'),
        ]);

        // If any stage rejected, mark expense rejected
        $expense = Expense::find($approval->expense_id);
        if ($expense) {
            $expense->update(['status' => 'rejected']);
        }

        return back()->withSuccess('Rejected');
    }
}
