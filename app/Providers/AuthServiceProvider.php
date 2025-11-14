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
			if (!$user) return false;

			// If spatie/laravel-permission is available on the User model, use it
			if (method_exists($user, 'hasAnyRole')) {
				if ($user->hasAnyRole(['admin', 'super_admin', 'finance_officer', 'accountant'])) return true;
			}

			if (method_exists($user, 'hasRole')) {
				if ($user->hasRole('admin') || $user->hasRole('super_admin')) return true;
			}

			// Check explicit permission via spatie or Laravel can()
			if (method_exists($user, 'hasPermissionTo') && $user->hasPermissionTo('finance.access')) return true;
			if (method_exists($user, 'can') && $user->can('finance.access')) return true;

			// Fallback to legacy properties if present
			$roles = $user->roles ?? [];
			$allowedRoles = ['admin', 'super_admin', 'finance_officer', 'accountant'];
			if (is_array($roles) && count(array_intersect($roles, $allowedRoles)) > 0) return true;
			if (is_string($roles) && in_array($roles, $allowedRoles)) return true;

			$perms = $user->permissions ?? [];
			if (is_array($perms) && in_array('finance.access', $perms)) return true;
			if (is_string($perms) && $perms === 'finance.access') return true;

			return false;
		});
	}
}


