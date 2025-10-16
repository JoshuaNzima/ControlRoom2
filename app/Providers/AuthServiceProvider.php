<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;
use App\Models\Down;
use App\Models\Guards\Guard;
use App\Policies\DownPolicy;
use App\Policies\GuardPolicy;

class AuthServiceProvider extends ServiceProvider
{
	protected $policies = [
		Down::class => DownPolicy::class,
		Guard::class => GuardPolicy::class,
	];

	public function boot(): void
	{
		$this->registerPolicies();
	}
}


