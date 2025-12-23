<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\App;
use Carbon\Carbon;
use Illuminate\Filesystem\Filesystem;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\Relations\Relation;
use PDO;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Session;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

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

        try {
            if (method_exists(RedirectResponse::class, 'macro')) {
                RedirectResponse::macro('withToast', function (string $message, string $type = 'info') {
                    $toasts = Session::get('toasts', []);
                    if (!is_array($toasts)) { $toasts = []; }
                    $toasts[] = ['id' => uniqid('t', true), 'message' => $message, 'type' => $type];
                    Session::flash('toasts', $toasts);
                    return $this;
                });
                RedirectResponse::macro('withSuccess', function (string $message) {
                    return $this->withToast($message, 'success');
                });
                RedirectResponse::macro('withError', function (string $message) {
                    return $this->withToast($message, 'error');
                });
                RedirectResponse::macro('withInfo', function (string $message) {
                    return $this->withToast($message, 'info');
                });
                RedirectResponse::macro('withWarning', function (string $message) {
                    return $this->withToast($message, 'warning');
                });
            }
        } catch (\Throwable $e) {
            // Non-fatal if macros fail to register
        }

        // Map legacy polymorphic short type names (e.g. 'guard') to FQCNs so
        // Eloquent's morphTo can resolve older DB rows that stored the short
        // type name instead of the full class name. This prevents exceptions
        // like "Class 'guard' not found" when loading polymorphic relations.
        try {
            Relation::morphMap([
                'guard' => \App\Models\Guards\Guard::class,
                'Guard' => \App\Models\Guards\Guard::class,
                'user' => \App\Models\User::class,
                'User' => \App\Models\User::class,
            ], false);
        } catch (\Throwable $e) {
            // Non-fatal: if morphMap fails for any reason, allow the app to continue
            // and let Eloquent throw the original error where appropriate.
        }

        // SQLite compatibility shim: define MONTH() and YEAR() functions when using sqlite
        // Some raw SQL (or older queries) may use MONTH(CURRENT_DATE) / YEAR(CURRENT_DATE)
        // which are not available in SQLite. Define lightweight equivalents on the
        // PDO connection so these SQL fragments don't cause hard errors in local/dev.
        try {
            if (DB::connection()->getDriverName() === 'sqlite') {
                $pdo = DB::getPdo();
                if (method_exists($pdo, 'sqliteCreateFunction')) {
                    // MONTH(date) -> numeric month (1-12)
                    $pdo->sqliteCreateFunction('MONTH', function ($date) {
                        $d = $date === 'CURRENT_DATE' || $date === null ? date('Y-m-d') : $date;
                        $ts = strtotime($d);
                        return $ts ? (int) date('n', $ts) : (int) date('n');
                    }, 1);

                    // YEAR(date) -> full year (e.g. 2025)
                    $pdo->sqliteCreateFunction('YEAR', function ($date) {
                        $d = $date === 'CURRENT_DATE' || $date === null ? date('Y-m-d') : $date;
                        $ts = strtotime($d);
                        return $ts ? (int) date('Y', $ts) : (int) date('Y');
                    }, 1);
                }
            }
        } catch (\Throwable $e) {
            // Don't break the app if this shim fails; it's only an optional convenience
            // for local sqlite environments. Fail silently.
        }

        try {
            $clear = function () {
                try { app(PermissionRegistrar::class)->forgetCachedPermissions(); } catch (\Throwable $e) {}
            };
            Role::saved($clear);
            Role::deleted($clear);
            Permission::saved($clear);
            Permission::deleted($clear);
        } catch (\Throwable $e) {
            // swallow
        }
    }
}
