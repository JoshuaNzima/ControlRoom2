<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Guards\{Guard, Attendance, Client, Shift};
use App\Models\User;
use App\Models\Core\Module;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\{DB, Cache, Artisan, File};
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        // System Overview
        $systemStats = [
            'total_users' => User::count(),
            'active_users' => User::where('status', 'active')->count(),
            'total_guards' => Guard::count(),
            'active_guards' => Guard::where('status', 'active')->count(),
            'total_clients' => Client::count(),
            'total_attendance_records' => Attendance::count(),
            'database_size' => $this->getDatabaseSize(),
            'cache_size' => $this->getCacheSize(),
        ];

        // Modules Management
        $modules = Module::orderBy('sort_order')->get()->map(fn($m) => [
            'id' => $m->id,
            'name' => $m->name,
            'display_name' => $m->display_name,
            'description' => $m->description,
            'is_active' => $m->is_active,
            'is_core' => $m->is_core,
            'version' => $m->version,
            'icon' => $m->icon,
            'color' => $m->color,
        ]);

        // System Health
        $systemHealth = [
            'php_version' => PHP_VERSION,
            'laravel_version' => app()->version(),
            'database' => $this->checkDatabaseConnection(),
            'cache' => $this->checkCacheConnection(),
            'storage_free' => $this->getStorageFree(),
            'memory_usage' => $this->getMemoryUsage(),
            'uptime' => $this->getSystemUptime(),
        ];

        // Recent System Logs
        $recentLogs = $this->getRecentLogs();

        // User Activity
        $userActivity = $this->getUserActivity();

        // Database Tables Info
        $databaseInfo = $this->getDatabaseInfo();

        // Audit Trail
        $auditTrail = $this->getAuditTrail();

        // Quick Admin Actions
        $adminActions = [
            [
                'title' => 'Module Management',
                'description' => 'Enable/disable system modules',
                'route' => 'superadmin.modules',
                'icon' => '🧩',
                'color' => '#8B5CF6',
            ],
            [
                'title' => 'User Management',
                'description' => 'Manage all system users',
                'route' => 'superadmin.users',
                'icon' => '👥',
                'color' => '#3B82F6',
            ],
            [
                'title' => 'System Settings',
                'description' => 'Configure system settings',
                'route' => 'superadmin.settings',
                'icon' => '⚙️',
                'color' => '#10B981',
            ],
            [
                'title' => 'Database Backup',
                'description' => 'Backup system database',
                'route' => 'superadmin.backup',
                'icon' => '💾',
                'color' => '#F59E0B',
            ],
            [
                'title' => 'System Logs',
                'description' => 'View system logs',
                'route' => 'superadmin.logs',
                'icon' => '📋',
                'color' => '#EF4444',
            ],
            [
                'title' => 'Audit Trail',
                'description' => 'View user activity',
                'route' => 'superadmin.audit',
                'icon' => '🔍',
                'color' => '#06B6D4',
            ],
            [
                'title' => 'Maintenance Mode',
                'description' => 'Enable maintenance',
                'route' => 'superadmin.maintenance',
                'icon' => '🔧',
                'color' => '#EC4899',
            ],
            [
                'title' => 'Cache Management',
                'description' => 'Clear system cache',
                'route' => 'superadmin.cache',
                'icon' => '🗑️',
                'color' => '#6366F1',
            ],
        ];

        return Inertia::render('SuperAdmin/Dashboard', [
            'systemStats' => $systemStats,
            'modules' => $modules,
            'systemHealth' => $systemHealth,
            'recentLogs' => $recentLogs,
            'userActivity' => $userActivity,
            'databaseInfo' => $databaseInfo,
            'auditTrail' => $auditTrail,
            'adminActions' => $adminActions,
        ]);
    }

    private function getDatabaseSize(): string
    {
        try {
            $size = DB::select("
                SELECT 
                    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb
                FROM information_schema.TABLES
                WHERE table_schema = ?
            ", [config('database.connections.mysql.database')]);
            
            return ($size[0]->size_mb ?? 0) . ' MB';
        } catch (\Exception $e) {
            return 'N/A';
        }
    }

    private function getCacheSize(): string
    {
        try {
            if (Cache::getStore() instanceof \Illuminate\Cache\RedisStore) {
                $redis = Cache::getRedis();
                $info = $redis->info('memory');
                $size = $info['used_memory_human'] ?? 'N/A';
                return $size;
            }
            return 'N/A';
        } catch (\Exception $e) {
            return 'N/A';
        }
    }

    private function checkDatabaseConnection(): string
    {
        try {
            DB::connection()->getPdo();
            return 'Connected';
        } catch (\Exception $e) {
            return 'Error';
        }
    }

    private function checkCacheConnection(): string
    {
        try {
            Cache::put('test', 'value', 10);
            return 'Working';
        } catch (\Exception $e) {
            return 'Error';
        }
    }

    private function getStorageFree(): string
    {
        $free = disk_free_space(storage_path());
        $total = disk_total_space(storage_path());
        $used = $total - $free;
        $percent = round(($used / $total) * 100, 1);
        
        return number_format($free / 1024 / 1024 / 1024, 2) . ' GB (' . $percent . '% used)';
    }

    private function getMemoryUsage(): string
    {
        $memory = memory_get_usage(true);
        return number_format($memory / 1024 / 1024, 2) . ' MB';
    }

    private function getSystemUptime(): string
    {
        if (PHP_OS_FAMILY === 'Linux') {
            $uptime = shell_exec('uptime -p');
            return $uptime ?: 'N/A';
        }
        return 'N/A';
    }

    private function getRecentLogs(): array
    {
        $logFile = storage_path('logs/laravel.log');
        
        if (!File::exists($logFile)) {
            return [];
        }

        $lines = file($logFile);
        $recentLines = array_slice($lines, -20);
        
        return array_map(function($line) {
            return [
                'message' => substr($line, 0, 100),
                'time' => now()->subMinutes(rand(1, 60))->diffForHumans(),
            ];
        }, $recentLines);
    }

    private function getUserActivity(): array
    {
        return User::with('roles')
            ->latest('updated_at')
            ->take(10)
            ->get()
            ->map(fn($user) => [
                'name' => $user->name,
                'role' => $user->roles->first()?->name ?? 'No Role',
                'last_active' => $user->updated_at->diffForHumans(),
            ])
            ->toArray();
    }

    private function getDatabaseInfo(): array
    {
        try {
            $tables = DB::select('SHOW TABLES');
            $tableCount = count($tables);
            
            return [
                'tables' => $tableCount,
                'records' => DB::table('users')->count() + DB::table('guards')->count(),
            ];
        } catch (\Exception $e) {
            return ['tables' => 0, 'records' => 0];
        }
    }

    private function getAuditTrail(): array
    {
        // This would come from an audit log table
        // For now, return sample data
        return [
            [
                'user' => 'Admin User',
                'action' => 'Created new guard',
                'time' => now()->subMinutes(15)->diffForHumans(),
                'ip' => '192.168.1.1',
            ],
            [
                'user' => 'Supervisor',
                'action' => 'Checked in guard',
                'time' => now()->subMinutes(30)->diffForHumans(),
                'ip' => '192.168.1.2',
            ],
        ];
    }

    public function toggleModule(Request $request, $moduleId)
    {
        $module = Module::findOrFail($moduleId);
        
        if ($module->is_core) {
            return back()->with('error', 'Cannot disable core modules.');
        }

        $module->update(['is_active' => !$module->is_active]);
        
        return back()->with('success', "Module {$module->display_name} " . 
            ($module->is_active ? 'enabled' : 'disabled') . ' successfully.');
    }

    public function clearCache()
    {
        Artisan::call('cache:clear');
        Artisan::call('config:clear');
        Artisan::call('route:clear');
        Artisan::call('view:clear');
        
        return back()->with('success', 'All caches cleared successfully.');
    }

    public function enableMaintenance()
    {
        Artisan::call('down', ['--secret' => 'super-secret-token']);
        
        return back()->with('success', 'Maintenance mode enabled.');
    }

    public function disableMaintenance()
    {
        Artisan::call('up');
        
        return back()->with('success', 'Maintenance mode disabled.');
    }
}