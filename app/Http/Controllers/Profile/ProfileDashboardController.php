<?php

namespace App\Http\Controllers\Profile;

use App\Http\Controllers\Controller;
use App\Models\Commission;
use App\Models\PayrollEntry;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ProfileDashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        if (!$user) abort(403);

        $pendingCommissions = Commission::where('user_id', $user->id)
            ->where('status', 'pending')
            ->orderByDesc('created_at')
            ->get(['id','source','client_id','amount','status','created_at']);

        $recentCommissions = Commission::where('user_id', $user->id)
            ->whereIn('status', ['claimed','rejected'])
            ->orderByDesc('created_at')
            ->limit(20)
            ->get(['id','source','client_id','amount','status','claimed_at','created_at']);

        $entries = PayrollEntry::query()
            ->where('payee_type', 'user')
            ->where('payee_id', $user->id)
            ->get(['base_amount','allowances','deductions','gross','net']);

        $totals = [
            'salary_total' => $entries->sum('base_amount'),
            'net_total' => $entries->sum('net'),
            'allowances_total' => 0,
            'overtime_total' => 0,
        ];
        foreach ($entries as $e) {
            $allow = is_array($e->allowances) ? $e->allowances : [];
            $sumAllow = 0;
            foreach ($allow as $k => $v) {
                $amt = is_array($v) && isset($v['amount']) ? (float)$v['amount'] : (float)$v;
                $sumAllow += $amt;
                if (is_string($k) && strtolower($k) === 'overtime') {
                    $totals['overtime_total'] += $amt;
                }
            }
            $totals['allowances_total'] += $sumAllow;
        }

        return Inertia::render('Profile/Dashboard', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone ?? null,
                'avatar_url' => $user->avatar_path ? asset('storage/' . ltrim($user->avatar_path, '/')) : null,
            ],
            'commissions' => [
                'pending' => $pendingCommissions,
                'recent' => $recentCommissions,
            ],
            'payroll' => [
                'totals' => $totals,
            ],
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => session('status'),
        ]);
    }

    public function claim(Commission $commission)
    {
        $user = Auth::user();
        if (!$user) abort(403);
        if ($commission->user_id !== $user->id || $commission->status !== 'pending') {
            abort(403);
        }
        $commission->update([
            'status' => 'claimed',
            'claimed_at' => now(),
            'claimed_by' => $user->id,
        ]);
        return back();
    }
}
