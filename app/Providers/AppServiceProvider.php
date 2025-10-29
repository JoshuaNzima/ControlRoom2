<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\App;
use Carbon\Carbon;
use Illuminate\Filesystem\Filesystem;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Ensure the 'files' binding exists early in the container. Some
        // core service providers expect the 'files' singleton to be
        // available; bind it here as a fallback so artisan commands and
        // provider boot methods don't fail if the Filesystem provider
        // isn't registered yet in this environment.
        if (! $this->app->bound('files')) {
            $this->app->singleton('files', function () {
                return new Filesystem();
            });
        }
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);
        App::setLocale(config('app.locale'));
        Carbon::setLocale(config('app.locale'));
    }
}
