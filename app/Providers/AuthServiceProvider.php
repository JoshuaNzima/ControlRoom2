<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;
use App\Models\Budget;
use App\Models\Down;
use App\Models\Expense;
use App\Models\Invoice;
use App\Models\Guards\Guard;
use App\Policies\BudgetPolicy;
use App\Policies\DownPolicy;
use App\Policies\ExpensePolicy;
use App\Policies\GuardPolicy;
use App\Policies\InvoicePolicy;
use App\Policies\ApprovalPolicy;
use App\Models\Approval;

class AuthServiceProvider extends ServiceProvider
{
protected $policies = [
Budget::class => BudgetPolicy::class,
Down::class => DownPolicy::class,
Expense::class => ExpensePolicy::class,
Invoice::class => InvoicePolicy::class,
Guard::class => GuardPolicy::class,
Approval::class => ApprovalPolicy::class,
];

public function boot(): void
{
$this->registerPolicies();

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