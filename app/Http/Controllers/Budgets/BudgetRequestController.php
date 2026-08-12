<?php

namespace App\Http\Controllers\Budgets;

use App\Http\Controllers\Controller;
use App\Models\BudgetRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BudgetRequestController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $query = BudgetRequest::query()->with(['requestedBy', 'approvedBy', 'releasedBy']);

        if ($user->hasAnyRole(['admin', 'super_admin'])) {
            // admins see everything
        } elseif ($user->hasAnyRole(['finance_officer','accountant','finance','accounting'])) {
            // Finance: allow toggling via mode=release|mine (default: release)
            $mode = $request->query('mode', 'release');
            if ($mode === 'mine') {
                $query->where('requested_by', $user->id);
            } else {
                $query->where('status', 'pending_release');
            }
        } else {
            // regular users see their own
            $query->where('requested_by', $user->id);
        }

        $budgets = $query->orderByDesc('created_at')->paginate(20);

        return Inertia::render('Budgets/Index', [
            'budgets' => $budgets,
            'mode' => $request->query('mode', $user->hasAnyRole(['finance_officer','accountant','finance','accounting']) ? 'release' : 'mine'),
            'auth' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'roles' => $user->getRoleNames(),
                ],
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'needed_by' => ['nullable', 'date'],
            'amount' => ['required', 'numeric', 'min:0'],
        ]);

        $data['requested_by'] = $user->id;
        $data['status'] = 'pending_admin';
        $data['category'] = $data['category'] ?? 'general';

        BudgetRequest::create($data);

        return redirect()->route('budgets.index');
    }

    public function show(BudgetRequest $budget): Response|JsonResponse
    {
        $budget->load(['requestedBy', 'approvedBy', 'releasedBy']);

        if (request()->wantsJson() || request()->ajax()) {
            return response()->json($budget);
        }

        return Inertia::render('Budgets/Show', [
            'budget' => $budget,
        ]);
    }

    public function resubmit(Request $request, BudgetRequest $budget): RedirectResponse
    {
        $this->authorizeOwner($request, $budget);

        if ($budget->status !== 'needs_revision') {
            return back();
        }

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'needed_by' => ['nullable', 'date'],
            'amount' => ['required', 'numeric', 'min:0'],
        ]);

        $budget->fill($data);
        $budget->status = 'pending_admin';
        $budget->notes_admin = null;
        $budget->save();

        return back();
    }

    public function summary(Request $request): JsonResponse
    {
        $user = $request->user();

        $myOpen = BudgetRequest::where('requested_by', $user->id)
            ->whereIn('status', ['pending_admin', 'needs_revision', 'pending_release'])
            ->count();

        $myNeedsRevision = BudgetRequest::where('requested_by', $user->id)
            ->where('status', 'needs_revision')
            ->count();

        $pendingAdmin = 0;
        $pendingRelease = 0;

        if ($user->hasAnyRole(['admin', 'super_admin'])) {
            $pendingAdmin = BudgetRequest::where('status', 'pending_admin')->count();
        }

        if ($user->hasAnyRole(['finance_officer','accountant','finance','accounting','super_admin'])) {
            $pendingRelease = BudgetRequest::where('status', 'pending_release')->count();
        }

        return response()->json([
            'success' => true,
            'my_open' => $myOpen,
            'my_needs_revision' => $myNeedsRevision,
            'pending_admin' => $pendingAdmin,
            'pending_release' => $pendingRelease,
        ]);
    }

    protected function authorizeOwner(Request $request, BudgetRequest $budget): void
    {
        abort_unless($request->user()->id === $budget->requested_by, 403);
    }
}
