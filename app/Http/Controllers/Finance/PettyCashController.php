<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Models\PettyCashEntry;
use App\Models\PettyCashBalance;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PettyCashController extends Controller
{
    public function index(Request $request)
    {
        $balance = PettyCashBalance::getCurrent();
        
        $query = PettyCashEntry::with(['user', 'approver'])
            ->when($request->input('type'), fn($q, $type) => $q->where('type', $type))
            ->when($request->input('status'), fn($q, $status) => $q->where('status', $status))
            ->when($request->input('category'), fn($q, $category) => $q->where('category', $category))
            ->when($request->input('start_date'), fn($q, $date) => $q->whereDate('date', '>=', $date))
            ->when($request->input('end_date'), fn($q, $date) => $q->whereDate('date', '<=', $date))
            ->when($request->input('search'), function($q, $search) {
                $q->where(function($qq) use ($search) {
                    $qq->where('description', 'like', "%{$search}%")
                       ->orWhere('vendor', 'like', "%{$search}%")
                       ->orWhere('receipt_number', 'like', "%{$search}%");
                });
            });
        
        $entries = $query->orderBy('date', 'desc')
            ->paginate(20)
            ->withQueryString();
        
        // Calculate monthly stats
        $monthStart = now()->startOfMonth();
        $monthEnd = now()->endOfMonth();
        
        $monthlyExpenses = PettyCashEntry::expenses()
            ->approved()
            ->forPeriod($monthStart, $monthEnd)
            ->sum('amount');
            
        $monthlyReplenished = PettyCashEntry::replenishments()
            ->approved()
            ->forPeriod($monthStart, $monthEnd)
            ->sum('amount');
            
        $pendingCount = PettyCashEntry::pending()->count();
        
        // Category breakdown for current month
        $categoryBreakdown = PettyCashEntry::expenses()
            ->approved()
            ->forPeriod($monthStart, $monthEnd)
            ->selectRaw('category, SUM(amount) as total')
            ->groupBy('category')
            ->get()
            ->map(fn($item) => [
                'category' => $item->category,
                'label' => PettyCashEntry::categories()[$item->category] ?? $item->category,
                'total' => (float) $item->total,
            ]);
        
        return Inertia::render('Finance/PettyCash/Index', [
            'entries' => $entries,
            'balance' => [
                'current' => (float) $balance->current_balance,
                'total_replenished' => (float) $balance->total_replenished,
                'total_spent' => (float) $balance->total_spent,
                'last_replenished_at' => $balance->last_replenished_at,
            ],
            'stats' => [
                'monthly_expenses' => (float) $monthlyExpenses,
                'monthly_replenished' => (float) $monthlyReplenished,
                'pending_count' => $pendingCount,
            ],
            'category_breakdown' => $categoryBreakdown,
            'categories' => PettyCashEntry::categories(),
            'filters' => $request->only(['type', 'status', 'category', 'start_date', 'end_date', 'search']),
        ]);
    }
    
    public function store(Request $request)
    {
        $validated = $request->validate([
            'date' => ['required', 'date'],
            'description' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'in:' . implode(',', array_keys(PettyCashEntry::categories()))],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'receipt_number' => ['nullable', 'string', 'max:50'],
            'vendor' => ['nullable', 'string', 'max:100'],
            'type' => ['required', 'in:expense,replenishment'],
            'notes' => ['nullable', 'string'],
        ]);
        
        $entry = PettyCashEntry::create([
            ...$validated,
            'user_id' => auth()->id(),
            'status' => 'pending',
        ]);
        
        // Auto-approve if user has finance approval permission
        if (auth()->user()->hasAnyPermission(['approve_expense', 'manage_expense', 'finance.approvals'])) {
            $entry->update([
                'status' => 'approved',
                'approved_by' => auth()->id(),
                'approved_at' => now(),
            ]);
            
            // Update balance
            $balance = PettyCashBalance::getCurrent();
            $balance->recalculate();
        }
        
        return back()->with('success', 'Petty cash entry recorded successfully.');
    }
    
    public function approve(PettyCashEntry $entry)
    {
        $this->authorize('approve', $entry);
        
        if ($entry->status !== 'pending') {
            return back()->with('error', 'Entry has already been processed.');
        }
        
        $entry->update([
            'status' => 'approved',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);
        
        // Update balance
        $balance = PettyCashBalance::getCurrent();
        $balance->recalculate();
        
        return back()->with('success', 'Entry approved successfully.');
    }
    
    public function reject(PettyCashEntry $entry)
    {
        $this->authorize('approve', $entry);
        
        if ($entry->status !== 'pending') {
            return back()->with('error', 'Entry has already been processed.');
        }
        
        $entry->update([
            'status' => 'rejected',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);
        
        return back()->with('success', 'Entry rejected.');
    }
    
    public function destroy(PettyCashEntry $entry)
    {
        $this->authorize('delete', $entry);
        
        if ($entry->status === 'approved') {
            return back()->with('error', 'Cannot delete approved entries.');
        }
        
        $entry->delete();
        
        return back()->with('success', 'Entry deleted successfully.');
    }
}
