<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class SystemController extends Controller
{
    // Render Logs page with initial tail
    public function logsIndex(Request $request)
    {
        $limit = (int) $request->get('limit', 200);
        $limit = max(20, min($limit, 2000));
        $lines = $this->tailLog($limit);

        return Inertia::render('SuperAdmin/Logs', [
            'logLines' => $lines,
        ]);
    }

    // JSON: return latest N log lines
    public function logsData(Request $request)
    {
        $limit = (int) $request->get('limit', 200);
        $limit = max(20, min($limit, 2000));
        return response()->json([
            'lines' => $this->tailLog($limit),
        ]);
    }

    // Download current laravel.log safely
    public function logsDownload()
    {
        $logFile = storage_path('logs/laravel.log');
        if (! File::exists($logFile)) {
            return back()->with('error', 'No log file found.');
        }
        return Response::download($logFile, 'laravel.log', [
            'Content-Type' => 'text/plain',
        ]);
    }

    // Render Audit page with sample/basic entries
    public function auditIndex(Request $request)
    {
        return Inertia::render('SuperAdmin/Audit', [
            'entries' => $this->getAuditEntries(),
        ]);
    }

    // JSON: Audit entries
    public function auditData(Request $request)
    {
        return response()->json([
            'entries' => $this->getAuditEntries(),
        ]);
    }

    // Render Maintenance with props
    public function maintenanceIndex(Request $request)
    {
        return Inertia::render('SuperAdmin/Maintenance', [
            'isMaintenance' => file_exists(storage_path('framework/down')),
            'maintenanceSecret' => env('APP_MAINTENANCE_SECRET', 'super-secret-token'),
        ]);
    }

    // POST: attempt to run backup if package exists, else inform
    public function backupRun(Request $request)
    {
        // If Spatie backup is installed, run it
        if (class_exists('Spatie\\Backup\\BackupServiceProvider')) {
            $default = (string) config('database.default');
            $driver = (string) (config("database.connections.$default.driver") ?? '');
            try {
                Artisan::call('backup:run');
                return back()->with('success', 'Backup started. Check logs for progress.');
            } catch (\Throwable $e) {
                $msg = (string) $e->getMessage();
                $shouldFilesOnly = $driver === 'sqlite' || str_contains(strtolower($msg), 'sqlite3');
                if ($shouldFilesOnly) {
                    try {
                        Artisan::call('backup:run', ['--only-files' => true, '--disable-notifications' => true]);
                        return back()->with('success', 'Files-only backup started (database dump unavailable).');
                    } catch (\Throwable $ee) {
                        return back()->with('error', 'Backup failed (files-only fallback also failed): ' . $ee->getMessage());
                    }
                }
                return back()->with('error', 'Backup failed: ' . $msg);
            }
        }
        return back()->with('error', 'Backup package not installed. Consider installing spatie/laravel-backup.');
    }

    // JSON: list backup files (supports Spatie default locations)
    public function backupsList()
    {
        $candidates = [
            storage_path('app/backups'),
            storage_path('app/backup'),
            storage_path('app/laravel'),
            storage_path('app/Laravel'),
            storage_path('app/laravel-backups'),
            storage_path('app/Laravel-backups'),
        ];

        // If Spatie backup config exists, also try name-based directories
        try {
            $name = config('backup.backup.name');
            if ($name) {
                $candidates[] = storage_path('app/' . $name);
                $candidates[] = storage_path('app/' . strtolower($name));
                $candidates[] = storage_path('app/' . $name . '-backups');
                $candidates[] = storage_path('app/' . strtolower($name) . '-backups');
            }
        } catch (\Throwable $e) {
            // ignore
        }

        $seen = [];
        $files = collect($candidates)
            ->filter(fn($dir) => File::isDirectory($dir))
            ->flatMap(function ($dir) use (&$seen) {
                return collect(File::files($dir))
                    ->filter(function ($f) use (&$seen) {
                        $path = $f->getPathname();
                        if (isset($seen[$path])) return false;
                        $seen[$path] = true;
                        return true;
                    });
            })
            ->sortByDesc(fn($f) => $f->getCTime())
            ->take(50)
            ->map(fn($f) => [
                'name' => $f->getFilename(),
                'size' => $f->getSize(),
                'modified_at' => date('c', $f->getMTime()),
            ])->values()->all();

        return response()->json(['files' => $files]);
    }

    public function backupDownload(string $file)
    {
        $safe = basename($file);
        $candidates = [
            storage_path('app/backups'),
            storage_path('app/backup'),
            storage_path('app/laravel'),
            storage_path('app/Laravel'),
            storage_path('app/laravel-backups'),
            storage_path('app/Laravel-backups'),
        ];
        try {
            $name = config('backup.backup.name');
            if ($name) {
                $candidates[] = storage_path('app/' . $name);
                $candidates[] = storage_path('app/' . strtolower($name));
                $candidates[] = storage_path('app/' . $name . '-backups');
                $candidates[] = storage_path('app/' . strtolower($name) . '-backups');
            }
        } catch (\Throwable $e) {}

        foreach ($candidates as $dir) {
            if (! File::isDirectory($dir)) continue;
            $path = $dir . DIRECTORY_SEPARATOR . $safe;
            if (File::exists($path)) {
                return Response::download($path, $safe);
            }
        }
        return back()->with('error', 'Backup file not found.');
    }

    private function tailLog(int $limit): array
    {
        $logFile = storage_path('logs/laravel.log');
        if (! File::exists($logFile)) {
            return [];
        }
        $lines = @file($logFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
        $slice = array_slice($lines, -$limit);
        return array_values($slice);
    }

    private function basicAuditEntries(): array
    {
        // Lightweight fallback audit summary using updated_at on core models.
        // Replace with a real activity log table when available.
        $entries = [];
        try {
            $users = \App\Models\User::select('id','name','updated_at')->latest('updated_at')->take(10)->get();
            foreach ($users as $u) {
                $entries[] = [
                    'model' => 'user',
                    'id' => $u->id,
                    'who' => $u->name,
                    'action' => 'profile_update',
                    'at' => $u->updated_at?->toDateTimeString(),
                ];
            }
        } catch (\Throwable $e) {
            // ignore
        }
        try {
            if (class_exists('App\\Models\\Guards\\Guard')) {
                $guards = \App\Models\Guards\Guard::select('id','name','updated_at')->latest('updated_at')->take(10)->get();
                foreach ($guards as $g) {
                    $entries[] = [
                        'model' => 'guard',
                        'id' => $g->id,
                        'who' => $g->name,
                        'action' => 'record_update',
                        'at' => $g->updated_at?->toDateTimeString(),
                    ];
                }
            }
        } catch (\Throwable $e) {
            // ignore
        }
        usort($entries, fn($a, $b) => strcmp($b['at'] ?? '', $a['at'] ?? ''));
        return array_slice($entries, 0, 20);
    }

    private function getAuditEntries(): array
    {
        // Prefer Spatie Activitylog when available and migrated
        try {
            if (class_exists('Spatie\\Activitylog\\Models\\Activity') && Schema::hasTable('activity_log')) {
                $list = \Spatie\Activitylog\Models\Activity::query()
                    ->with('causer')
                    ->latest('created_at')
                    ->limit(50)
                    ->get(['id','description','event','subject_type','subject_id','causer_type','causer_id','properties','created_at']);

                return $list->map(function ($a) {
                    return [
                        'model' => strtolower(class_basename($a->subject_type ?? '')),
                        'id' => $a->subject_id,
                        'who' => optional($a->causer)->name ?? ($a->causer_id ?: 'System'),
                        'action' => $a->description ?: ($a->event ?: 'activity'),
                        'at' => optional($a->created_at)?->toDateTimeString(),
                        'properties' => $a->properties,
                    ];
                })->toArray();
            }
        } catch (\Throwable $e) {
            // fall back below
        }
        return $this->basicAuditEntries();
    }
}
