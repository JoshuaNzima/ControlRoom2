<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ClientPayment;
use App\Models\Guards\Client;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $year = (int) ($request->input('year') ?: now()->year);
        $clients = Client::orderBy('name')->get(['id', 'name', 'contract_start_date', 'contract_end_date', 'monthly_rate']);

        $rawPayments = ClientPayment::where('year', $year)
            ->get(['client_id', 'month', 'paid', 'amount_due', 'amount_paid'])
            ->groupBy('client_id');

        // Build derived payments per client with arrears carry-over and contract window
        $payments = collect();
        foreach ($clients as $client) {
            $map = [];
            for ($m = 1; $m <= 12; $m++) {
                $map[$m] = [
                    'paid' => false,
                    'amount_due' => 0.0,
                    'amount_paid' => 0.0,
                ];
            }
            $rows = $rawPayments->get($client->id) ?? collect();
            foreach ($rows as $r) {
                $map[(int) $r->month]['paid'] = (bool) $r->paid;
                $map[(int) $r->month]['amount_due'] = (float) $r->amount_due;
                $map[(int) $r->month]['amount_paid'] = (float) $r->amount_paid;
            }

            // Determine contract active months for this year
            $contractStart = $client->contract_start_date ? \Carbon\Carbon::parse($client->contract_start_date) : null;
            $contractEnd = $client->contract_end_date ? \Carbon\Carbon::parse($client->contract_end_date) : null;
            $monthlyRate = (float) ($client->monthly_rate ?? 0);

            $carry = 0.0;
            for ($m = 1; $m <= 12; $m++) {
                $ym = \Carbon\Carbon::createFromDate($year, $m, 1);
                $inWindow = true;
                if ($contractStart && $ym->lt($contractStart->copy()->startOfMonth())) {
                    $inWindow = false;
                }
                if ($contractEnd && $ym->gt($contractEnd->copy()->endOfMonth())) {
                    $inWindow = false;
                }

                $baseDue = $inWindow ? $monthlyRate : 0.0;
                // amount due for month is base plus any unpaid carry from previous months in contract window
                $map[$m]['amount_due'] = round($baseDue + $carry, 2);
                if ($map[$m]['paid']) {
                    // Only subtract this month's base from the rolling balance when paid
                    $map[$m]['amount_paid'] = round($baseDue, 2);
                    // Reduce carry by this month's base if any carry exists from previous months
                    $carry = max(0.0, round($carry - $baseDue, 2));
                } else {
                    // Add this month's base to carry if unpaid
                    $carry = round($carry + $baseDue, 2);
                }
            }

            $payments->put($client->id, $map);
        }

        // Compute flags: clients with 3+ unpaid months up to current month
        $currentYear = now()->year;
        $currentMonth = now()->month;
        $flags = [];
        foreach ($clients as $client) {
            $clientPayments = $payments->get($client->id) ?? [];
            $limitMonth = $year < $currentYear ? 12 : ($year > $currentYear ? 0 : $currentMonth);
            $unpaidCount = 0;
            for ($m = 1; $m <= $limitMonth; $m++) {
                $monthState = $clientPayments[$m] ?? ['paid' => false];
                if (!($monthState['paid'] ?? false)) {
                    $unpaidCount++;
                }
            }
            if ($unpaidCount >= 3) {
                $flags[$client->id] = true;
            }
        }

        return Inertia::render('Admin/Payments/Index', [
            'year' => $year,
            'clients' => $clients,
            'payments' => $payments,
            'flags' => $flags,
        ]);
    }

    public function toggle(Request $request)
    {
        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'year' => 'required|integer|min:2000|max:2100',
            'month' => 'required|integer|min:1|max:12',
            // amount_due removed from UI; backend derives it
        ]);

        $payment = ClientPayment::firstOrCreate([
            'client_id' => $validated['client_id'],
            'year' => $validated['year'],
            'month' => $validated['month'],
        ], [
            'paid' => false,
            'amount_due' => optional(Client::find($validated['client_id']))->getMonthlyDueAmount() ?? 0,
            'amount_paid' => 0,
        ]);

        $newPaid = ! $payment->paid;
        $amountDue = ($payment->amount_due ?: optional($payment->client)->getMonthlyDueAmount() ?: 0);
        $payment->update([
            'paid' => $newPaid,
            'amount_due' => $amountDue,
            'amount_paid' => $newPaid ? $amountDue : 0,
        ]);

        // After toggle, check for delinquency and log
        $year = (int) $validated['year'];
        $clientId = (int) $validated['client_id'];
        $unpaidCount = ClientPayment::where('client_id', $clientId)
            ->where('year', $year)
            ->where('month', '<=', now()->year === $year ? now()->month : 12)
            ->where('paid', false)
            ->count();
        if ($unpaidCount >= 3) {
            Log::warning('Client has 3+ unpaid months', ['client_id' => $clientId, 'year' => $year, 'unpaid_months' => $unpaidCount]);
        }

        return back();
    }
}


