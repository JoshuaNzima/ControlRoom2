<?php

namespace App\Http\Controllers\FrontOffice;

use App\Http\Controllers\Controller;
use App\Models\Visitor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class VisitorController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $role = $this->getRole($user);

        $visitors = Visitor::with('host')
            ->when(request('date'), function($q, $date) {
                $q->whereDate('created_at', $date);
            }, function($q) {
                $q->whereDate('created_at', today());
            })
            ->orderBy('created_at', 'desc')
            ->paginate(20)
            ->withQueryString();

        $todayCount = Visitor::whereDate('created_at', today())->count();

        return inertia('FrontOffice/Visitors/Index', [
            'visitors' => $visitors,
            'stats' => [
                'today' => $todayCount,
                'checked_in' => $todayCount,
                'checked_out' => 0,
            ],
            'filters' => request()->only(['date', 'status']),
            'role' => $role,
            'can' => [
                'manage_calendar' => in_array($role, ['executive_assistant', 'personal_assistant', 'admin', 'super_admin']),
                'manage_tasks' => in_array($role, ['executive_assistant', 'personal_assistant', 'admin', 'super_admin']),
                'view_reports' => in_array($role, ['executive_assistant', 'admin', 'super_admin']),
                'export_data' => in_array($role, ['executive_assistant', 'admin', 'super_admin']),
            ],
        ]);
    }

    private function getRole($user): string
    {
        $roles = $user->roles->pluck('name')->toArray();

        foreach (['executive_assistant', 'personal_assistant', 'receptionist', 'super_admin', 'admin'] as $r) {
            if (in_array($r, $roles)) {
                return $r;
            }
        }

        return 'receptionist';
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'company' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'purpose' => 'required|string|max:255',
            'host_id' => 'nullable|exists:users,id',
            'host_name' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        $visitor = Visitor::create([
            ...$validated,
            'badge_number' => $this->generateBadgeNumber(),
            'registered_by' => Auth::id(),
        ]);

        return back()->with('success', 'Visitor registered successfully. Badge: ' . $visitor->badge_number);
    }

    public function badge(Visitor $visitor)
    {
        // Generate new badge number
        $visitor->update([
            'badge_number' => $this->generateBadgeNumber(),
        ]);

        return back()->with('success', 'New badge issued: ' . $visitor->badge_number);
    }

    private function generateBadgeNumber(): string
    {
        $prefix = 'V' . now()->format('ymd');
        $last = Visitor::whereDate('created_at', today())
            ->where('badge_number', 'like', $prefix . '%')
            ->orderByDesc('id')
            ->first();

        $seq = 1;
        if ($last && preg_match('/' . $prefix . '(\d{3})/', $last->badge_number, $m)) {
            $seq = (int) $m[1] + 1;
        }

        return $prefix . str_pad($seq, 3, '0', STR_PAD_LEFT);
    }
}
