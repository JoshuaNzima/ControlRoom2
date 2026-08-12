<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Artisan;
use App\Models\Guards\Client;
use App\Models\ClientPayment;
use Carbon\Carbon;

class PrepaymentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Freeze time for deterministic tests
        Carbon::setTestNow(Carbon::create(2025, 10, 29));
    }

    public function test_toggle_future_month_sets_prepaid_and_does_not_increment_total_paid()
    {
        $this->withoutMiddleware();

        $client = Client::create(['name' => 'Acme', 'monthly_rate' => 1000]);

        $futureMonth = 12; // December 2025 is in future relative to Oct 29 2025

        $response = $this->post(route('admin.payments.toggle'), [
            'client_id' => $client->id,
            'year' => 2025,
            'month' => $futureMonth,
        ]);

        $this->assertDatabaseHas('client_payments', [
            'client_id' => $client->id,
            'year' => 2025,
            'month' => $futureMonth,
            'prepaid_amount' => 1000.00,
            'amount_paid' => 0.00,
            'paid' => 1,
        ]);

        $totalPaid = DB::table('client_payments')->where('year', 2025)->sum('amount_paid');
        $this->assertEquals(0.0, (float)$totalPaid);
    }

    public function test_migrate_prepayments_moves_prepaid_to_amount_paid()
    {
        $this->withoutMiddleware();

        $client = Client::create(['name' => 'Acme', 'monthly_rate' => 1000]);

        // Create a payment for current month with a prepaid amount
        $currentMonth = now()->month;
        $currentYear = now()->year;

        $payment = ClientPayment::create([
            'client_id' => $client->id,
            'year' => $currentYear,
            'month' => $currentMonth,
            'paid' => true,
            'amount_due' => 1000,
            'amount_paid' => 0,
            'prepaid_amount' => 1000,
        ]);

        // Run the artisan command
        Artisan::call('prepayments:migrate');

        $this->assertDatabaseHas('client_payments', [
            'id' => $payment->id,
            'amount_paid' => 1000.00,
            'prepaid_amount' => 0.00,
        ]);
    }

    public function test_aggregates_respect_prepaid_vs_paid()
    {
        $this->withoutMiddleware();

        $client = Client::create(['name' => 'Acme', 'monthly_rate' => 1000]);

        // Past month (Sep) fully paid
        ClientPayment::create([
            'client_id' => $client->id,
            'year' => 2025,
            'month' => 9,
            'paid' => true,
            'amount_due' => 1000,
            'amount_paid' => 1000,
            'prepaid_amount' => 0,
        ]);

        // Future month (Dec) prepaid
        ClientPayment::create([
            'client_id' => $client->id,
            'year' => 2025,
            'month' => 12,
            'paid' => true,
            'amount_due' => 1000,
            'amount_paid' => 0,
            'prepaid_amount' => 1000,
        ]);

        // Compute recognized total_paid only for current/past months (should be 1000)
        $currentYear = now()->year;
        $currentMonth = now()->month;

        $totalPaid = DB::table('client_payments')
            ->where(function ($q) use ($currentYear, $currentMonth) {
                $q->where('year', '<', $currentYear)
                  ->orWhere(function ($q2) use ($currentYear, $currentMonth) {
                      $q2->where('year', $currentYear)
                         ->where('month', '<=', $currentMonth);
                  });
            })
            ->sum('amount_paid');

        $this->assertEquals(1000.0, (float)$totalPaid);

        // Outstanding should consider prepaid_amount as coverage for future months
        $outstanding = DB::table('client_payments')
            ->where('year', 2025)
            ->whereRaw('amount_due > (amount_paid + prepaid_amount)')
            ->count();

        // Neither of the two months should be considered outstanding
        $this->assertEquals(0, $outstanding);
    }

    public function test_partial_prepayment_amount_is_recorded()
    {
        $this->withoutMiddleware();

        $client = Client::create(['name' => 'Acme', 'monthly_rate' => 1000]);

        $futureMonth = 12;

        $response = $this->post(route('admin.payments.toggle'), [
            'client_id' => $client->id,
            'year' => 2025,
            'month' => $futureMonth,
            'amount' => 250.50,
        ]);

        $this->assertDatabaseHas('client_payments', [
            'client_id' => $client->id,
            'year' => 2025,
            'month' => $futureMonth,
            'prepaid_amount' => 250.50,
            'amount_paid' => 0.00,
            'paid' => 1,
        ]);
    }

    public function test_overpayment_is_recorded_and_migrated()
    {
        $this->withoutMiddleware();

        $client = Client::create(['name' => 'Acme', 'monthly_rate' => 1000]);

        // Prepay more than due
        $futureMonth = 12;
        $this->post(route('admin.payments.toggle'), [
            'client_id' => $client->id,
            'year' => 2025,
            'month' => $futureMonth,
            'amount' => 1500,
        ]);

        $this->assertDatabaseHas('client_payments', [
            'client_id' => $client->id,
            'year' => 2025,
            'month' => $futureMonth,
            'prepaid_amount' => 1500,
        ]);

        // Create a current month record that was prepaid (simulate migrating)
        $currentMonth = now()->month;
        $currentYear = now()->year;
        ClientPayment::create([
            'client_id' => $client->id,
            'year' => $currentYear,
            'month' => $currentMonth,
            'paid' => true,
            'amount_due' => 1000,
            'amount_paid' => 0,
            'prepaid_amount' => 1500,
        ]);

        Artisan::call('prepayments:migrate');

        $this->assertDatabaseHas('client_payments', [
            'year' => $currentYear,
            'month' => $currentMonth,
            'amount_paid' => 1500.00,
            'prepaid_amount' => 0.00,
        ]);
    }
}
