<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;
use App\Models\Budget;
use App\Models\Down;
use App\Models\Expense;
use App\Models\Invoice;
use App\Models\Guards\Guard;
use App\Models\Approval;
use App\Policies\BudgetPolicy;
use App\Policies\DownPolicy;
use App\Policies\ExpensePolicy;
use App\Policies\GuardPolicy;
use App\Policies\InvoicePolicy;
use App\Policies\ApprovalPolicy;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array
     */
    protected $policies = [
        Approval::class => ApprovalPolicy::class,
        Budget::class => BudgetPolicy::class,
        Down::class => DownPolicy::class,
        Expense::class => ExpensePolicy::class,
        Guard::class => GuardPolicy::class,
        Invoice::class => InvoicePolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     *
     * @return void
     */
    public function boot(): void
    {
        $this->registerPolicies();

        Gate::before(function ($user) {
            if ($user && method_exists($user, 'hasRole') && $user->hasRole('super_admin')) {
                return true;
            }
        });

        // Gate for finance access used by the Finance dashboard and drilldown APIs
        Gate::define('finance.access', function ($user) {
            if (!$user) {
                return false;
            }

            // Check if user has any of the finance-access roles using Spatie
            if ($user->hasAnyRole(['admin', 'super_admin', 'finance_officer', 'accountant'])) {
                return true;
            }

            // Check if user has the explicit permission
            if ($user->hasPermissionTo('finance.access')) {
                return true;
            }

            return false;
        });
    }
}