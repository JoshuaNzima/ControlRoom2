<?php

namespace App\Http\Controllers\ExecutiveAssistant;

use App\Http\Controllers\Controller;
use App\Models\PettyCashEntry;
use App\Models\PettyCashBalance;
use App\Models\Expense;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PettyCashController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth', 'role:executive_assistant,super_admin']);
    }

    public function index(Request $request)
    {
        $query = PettyCashEntry::with(['user', 'approver'])
            ->orderBy('date', 'desc');

        // Apply filters
        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('date', '<=', $request->date_to);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhere('receipt_number', 'like', "%{$search}%");
            });
        }

        $entries = $query->paginate(20)->withQueryString();

        // Calculate stats
        $balance = PettyCashBalance::getCurrent();
        $pendingAmount = PettyCashEntry::where('status', 'pending')->sum('amount');

        $currentMonth = now();
        $monthlyExpenses = PettyCashEntry::expenses()
            ->approved()
            ->whereYear('date', $currentMonth->year)
            ->whereMonth('date', $currentMonth->month)
            ->sum('amount');

        $monthlyReplenishments = PettyCashEntry::replenishments()
            ->approved()
            ->whereYear('date', $currentMonth->year)
            ->whereMonth('date', $currentMonth->month)
            ->sum('amount');

        // Calculate pending sync to finance
        $pendingSyncAmount = PettyCashEntry::expenses()
            ->approved()
            ->where('synced_to_finance', false)
            ->sum('amount');

        return Inertia::render('ExecutiveAssistant/PettyCash/Index', [
            'entries' => $entries,
            'stats' => [
                'current_balance' => $balance->current_balance,
                'pending_amount' => $pendingAmount,
                'monthly_expenses' => $monthlyExpenses,
                'monthly_replenishments' => $monthlyReplenishments,
                'pending_sync_amount' => $pendingSyncAmount,
            ],
            'filters' => $request->only(['category', 'type', 'status', 'date_from', 'date_to', 'search']),
            'categories' => PettyCashEntry::categories(),
            'role' => $this->getRole($request->user()),
            'can' => [
                'manage_calendar' => true,
                'manage_tasks' => true,
                'view_reports' => true,
                'export_data' => true,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'description' => 'required|string|max:255',
            'category' => 'required|string|in:' . implode(',', array_keys(PettyCashEntry::categories())),
            'amount' => 'required|numeric|min:0.01',
            'type' => 'required|string|in:expense,replenishment',
            'receipt_number' => 'nullable|string|max:50',
            'vendor' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:500',
        ]);

        $validated['user_id'] = auth()->id();
        $validated['status'] = 'pending';
        $validated['synced_to_finance'] = false;

        // Auto-approve for super_admins
        if (auth()->user()->hasRole('super_admin')) {
            $validated['status'] = 'approved';
            $validated['approved_by'] = auth()->id();
            $validated['approved_at'] = now();
        }

        $entry = PettyCashEntry::create($validated);

        // Update balance for approved entries
        if ($entry->status === 'approved') {
            $this->updateBalance($entry);
        }

        return redirect()->back()->with('success', 'Entry added successfully.');
    }

    public function update(Request $request, PettyCashEntry $entry)
    {
        if ($entry->status !== 'pending') {
            return redirect()->back()->with('error', 'Only pending entries can be edited.');
        }

        if ($entry->user_id !== auth()->id() && !auth()->user()->hasRole('super_admin')) {
            abort(403, 'Unauthorized action.');
        }

        $validated = $request->validate([
            'date' => 'required|date',
            'description' => 'required|string|max:255',
            'category' => 'required|string|in:' . implode(',', array_keys(PettyCashEntry::categories())),
            'amount' => 'required|numeric|min:0.01',
            'type' => 'required|string|in:expense,replenishment',
            'receipt_number' => 'nullable|string|max:50',
            'vendor' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:500',
        ]);

        $entry->update($validated);

        return redirect()->back()->with('success', 'Entry updated successfully.');
    }

    public function destroy(PettyCashEntry $entry)
    {
        if ($entry->status !== 'pending') {
            return redirect()->back()->with('error', 'Only pending entries can be deleted.');
        }

        if ($entry->user_id !== auth()->id() && !auth()->user()->hasRole('super_admin')) {
            abort(403, 'Unauthorized action.');
        }

        $entry->delete();

        return redirect()->back()->with('success', 'Entry deleted successfully.');
    }

    public function approve(PettyCashEntry $entry)
    {
        if ($entry->status !== 'pending') {
            return redirect()->back()->with('error', 'Only pending entries can be approved.');
        }

        $entry->update([
            'status' => 'approved',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        $this->updateBalance($entry);

        return redirect()->back()->with('success', 'Entry approved successfully.');
    }

    public function reject(PettyCashEntry $entry)
    {
        if ($entry->status !== 'pending') {
            return redirect()->back()->with('error', 'Only pending entries can be rejected.');
        }

        $entry->update([
            'status' => 'rejected',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Entry rejected successfully.');
    }

    public function reports(Request $request)
    {
        $year = $request->input('year', now()->year);
        $month = $request->input('month', now()->month);

        $monthlyData = [];
        for ($m = 1; $m <= 12; $m++) {
            $expenses = PettyCashEntry::expenses()
                ->approved()
                ->whereYear('date', $year)
                ->whereMonth('date', $m)
                ->sum('amount');

            $replenishments = PettyCashEntry::replenishments()
                ->approved()
                ->whereYear('date', $year)
                ->whereMonth('date', $m)
                ->sum('amount');

            $monthlyData[$m] = [
                'expenses' => $expenses,
                'replenishments' => $replenishments,
                'net' => $replenishments - $expenses,
            ];
        }

        $categoryBreakdown = PettyCashEntry::expenses()
            ->approved()
            ->whereYear('date', $year)
            ->selectRaw('category, SUM(amount) as total')
            ->groupBy('category')
            ->pluck('total', 'category')
            ->toArray();

        // Calculate total pending sync to finance
        $pendingSyncTotal = PettyCashEntry::expenses()
            ->approved()
            ->where('synced_to_finance', false)
            ->sum('amount');

        return Inertia::render('ExecutiveAssistant/PettyCash/Reports', [
            'year' => $year,
            'monthly_data' => $monthlyData,
            'category_breakdown' => $categoryBreakdown,
            'categories' => PettyCashEntry::categories(),
            'pending_sync_total' => $pendingSyncTotal,
        ]);
    }

    /**
     * Sync approved expenses to Finance module
     * This creates expense records in the finance system
     */
    public function syncToFinance(Request $request)
    {
        $validated = $request->validate([
            'entry_ids' => 'nullable|array',
            'entry_ids.*' => 'exists:petty_cash_entries,id',
            'sync_all' => 'nullable|boolean',
        ]);

        $query = PettyCashEntry::expenses()
            ->approved()
            ->where('synced_to_finance', false);

        if (!empty($validated['entry_ids'])) {
            $query->whereIn('id', $validated['entry_ids']);
        }

        $entries = $query->get();
        $syncedCount = 0;
        $totalAmount = 0;

        foreach ($entries as $entry) {
            // Create corresponding expense in Finance
            Expense::create([
                'category' => 'petty_cash',
                'amount' => $entry->amount,
                'date' => $entry->date,
                'notes' => "Petty Cash: {$entry->description}",
                'reference_number' => $entry->receipt_number,
                'status' => 'approved',
                'created_by' => auth()->id(),
                'petty_cash_entry_id' => $entry->id,
            ]);

            $entry->update(['synced_to_finance' => true]);
            $syncedCount++;
            $totalAmount += $entry->amount;
        }

        return redirect()->back()->with('success', "{$syncedCount} entries (KES {$totalAmount}) synced to Finance successfully.");
    }

    private function updateBalance(PettyCashEntry $entry): void
    {
        $balance = PettyCashBalance::getCurrent();
        $balance->recalculate();
    }

    private function getRole($user): string
    {
        $roles = $user->roles->pluck('name')->toArray();

        foreach (['executive_assistant', 'super_admin', 'admin', 'personal_assistant', 'receptionist'] as $r) {
            if (in_array($r, $roles)) {
                return $r;
            }
        }

        return 'receptionist';
    }
}
