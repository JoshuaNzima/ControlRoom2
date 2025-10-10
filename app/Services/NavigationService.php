<?php

namespace App\Services;

use App\Models\Core\Module;
use Illuminate\Support\Collection;

class NavigationService
{
    public function getNavigationForUser($user): Collection
    {
        return Module::active()
            ->orderBy('sort_order')
            ->get()
            ->filter(function ($module) use ($user) {
                return $this->userCanAccessModule($user, $module);
            })
            ->map(function ($module) use ($user) {
                return [
                    'name' => $module->name,
                    'display_name' => $module->display_name,
                    'description' => $module->description,
                    'icon' => $module->icon,
                    'color' => $module->color,
                    // Prefer numeric id when available for stable frontend keys
                    'id' => $module->id ?? $module->name,
                    'route' => $this->getModuleRoute($module->name),
                    'features' => $this->getModuleFeatures($module, $user),
                    'children' => $this->getModuleNavigation($module->name, $user),
                ];
            });
    }

    private function getModuleFeatures($module, $user): array
    {
        $features = $module->config['features'] ?? [];
        
        // Filter features based on user permissions
        return collect($features)->filter(function ($description, $feature) use ($user, $module) {
            $permission = "{$module->name}.{$feature}.view";
            return $user->can($permission) || $user->hasRole('super_admin');
        })->toArray();
    }

    private function userCanAccessModule($user, $module): bool
    {
        if ($user->hasRole('super_admin')) {
            return true;
        }

        $modulePermissions = $user->getAllPermissions()
            ->filter(fn($p) => str_starts_with($p->name, $module->name . '.'));
        
        return $modulePermissions->isNotEmpty();
    }

    private function getModuleRoute(?string $moduleName): string
    {
        if (empty($moduleName)) {
            return '#';
        }

        return match ($moduleName) {
            'guards' => 'guards.index',
            'hr' => 'hr.leaves',
            'clients' => 'clients.index',
            'k9' => 'k9.dashboard',
            'control_room' => 'control-room.dashboard',
            'reports' => 'reports.index',
            'admin' => 'admin.dashboard',
            default => '#',
        };
    }

    private function getModuleNavigation(?string $moduleName, $user): array
    {
        if (empty($moduleName)) {
            return [];
        }

        $navigation = match ($moduleName) {
            'guards' => [
                ['name' => 'Dashboard', 'route' => 'supervisor.dashboard', 'permission' => 'guards.view', 'icon' => 'HiOutlineViewGrid'],
                ['name' => 'Guards', 'route' => 'guards.index', 'permission' => 'guards.view', 'icon' => 'HiOutlineShieldCheck'],
                ['name' => 'Attendance', 'route' => 'supervisor.attendance', 'permission' => 'attendance.view', 'icon' => 'HiOutlineClipboardList'],
                ['name' => 'Shifts', 'route' => 'supervisor.shifts', 'permission' => 'shifts.view', 'icon' => 'HiOutlineCalendar'],
                ['name' => 'Reports', 'route' => 'supervisor.reports', 'permission' => 'reports.view', 'icon' => 'HiOutlineDocumentReport'],
                ['name' => 'Incidents', 'route' => 'guards.incidents', 'permission' => 'incidents.view', 'icon' => 'HiOutlineExclamation'],
                ['name' => 'Operations', 'route' => 'guards.operations', 'permission' => 'guards.view', 'icon' => 'HiOutlineCog'],
            ],
            'hr' => [
                ['name' => 'Dashboard', 'route' => 'hr.dashboard', 'permission' => 'hr.employees.view', 'icon' => 'HiOutlineViewGrid'],
                ['name' => 'Leave Management', 'route' => 'hr.leaves', 'permission' => 'hr.leaves.view', 'icon' => 'HiOutlineCalendar'],
                ['name' => 'Archived Guards', 'route' => 'hr.archived', 'permission' => 'hr.employees.view', 'icon' => 'HiOutlineArchive'],
                ['name' => 'Resigned', 'route' => 'hr.resigned', 'permission' => 'hr.employees.view', 'icon' => 'HiOutlineUserRemove'],
                ['name' => 'Dismissed', 'route' => 'hr.dismissed', 'permission' => 'hr.employees.view', 'icon' => 'HiOutlineXCircle'],
            ],
            'clients' => [
                ['name' => 'All Clients', 'route' => 'clients.index', 'permission' => 'clients.view', 'icon' => 'HiOutlineOfficeBuilding'],
                ['name' => 'Sites', 'route' => 'clients.index', 'permission' => 'clients.view', 'icon' => 'HiOutlineLocationMarker'],
            ],
            'k9' => [
                ['name' => 'Dashboard', 'route' => 'k9.dashboard', 'permission' => 'k9.view', 'icon' => 'HiOutlineViewGrid'],
                ['name' => 'Dogs', 'route' => 'k9.dogs', 'permission' => 'k9.view', 'icon' => '🐕'],
                ['name' => 'Handlers', 'route' => 'k9.handlers', 'permission' => 'k9.view', 'icon' => 'HiOutlineUser'],
            ],
            'control_room' => [
                ['name' => 'Live Dashboard', 'route' => 'control-room.dashboard', 'permission' => 'control.dashboard.view', 'icon' => 'HiOutlineDesktopComputer'],
                ['name' => 'Incidents', 'route' => 'control-room.incidents', 'permission' => 'control.incidents.view', 'icon' => 'HiOutlineExclamation'],
                ['name' => 'Alerts', 'route' => 'control-room.alerts', 'permission' => 'control.alerts.view', 'icon' => 'HiOutlineBell'],
            ],
            'reports' => [
                ['name' => 'All Reports', 'route' => 'reports.index', 'permission' => 'reports.view', 'icon' => 'HiOutlineChartBar'],
                ['name' => 'Activity Logs', 'route' => 'reports.activity-logs', 'permission' => 'reports.view', 'icon' => 'HiOutlineClock'],
                ['name' => 'Analytics', 'route' => 'reports.index', 'permission' => 'reports.analytics', 'icon' => 'HiOutlineTrendingUp'],
            ],
            'admin' => [
                ['name' => 'Dashboard', 'route' => 'admin.dashboard', 'permission' => 'admin.system.view', 'icon' => 'HiOutlineViewGrid'],
                ['name' => 'Users', 'route' => 'admin.users.index', 'permission' => 'admin.users.view', 'icon' => 'HiOutlineUsers'],
                ['name' => 'Roles', 'route' => 'admin.roles', 'permission' => 'admin.roles.view', 'icon' => 'HiOutlineKey'],
                ['name' => 'Modules', 'route' => 'admin.modules', 'permission' => 'admin.modules.manage', 'icon' => 'HiOutlinePuzzle'],
                ['name' => 'Settings', 'route' => 'admin.settings', 'permission' => 'admin.settings.view', 'icon' => 'HiOutlineCog'],
            ],
            default => [],
        };

        // Filter navigation items by user permissions and ensure stable ids
        return collect($navigation)->filter(function ($item) use ($user) {
            return $user->can($item['permission']) || $user->hasRole('super_admin');
        })->values()->map(function ($item, $idx) {
            return array_merge(['id' => $item['route'] ?? $item['name'] ?? "item-{$idx}"], $item);
        })->toArray();
    }

    public function getGuardStatistics(): array
    {
        return [
            'active' => [
                'label' => 'Active Guards',
                'count' => \App\Models\Guards\Guard::where('status', 'active')->count(),
                'description' => 'On duty',
                'color' => 'green',
                'badge' => 'Active',
            ],
            'relief' => [
                'label' => 'Relief Guards',
                'count' => 0, // Will be implemented with shift system
                'description' => 'Available',
                'color' => 'blue',
                'badge' => 'Reliever',
            ],
            'on_leave' => [
                'label' => 'On Leave',
                'count' => 0, // Will be implemented with HR module
                'description' => 'Temporary absence',
                'color' => 'yellow',
                'badge' => 'On Leave',
            ],
            'resigned' => [
                'label' => 'Resigned',
                'count' => 0,
                'description' => 'Past 12 months',
                'color' => 'gray',
                'badge' => 'Resigned',
            ],
            'dismissed' => [
                'label' => 'Dismissed',
                'count' => 0,
                'description' => 'Past 12 months',
                'color' => 'orange',
                'badge' => 'Dismissed',
            ],
            'absconded' => [
                'label' => 'Absconded',
                'count' => 0,
                'description' => 'Past 12 months',
                'color' => 'red',
                'badge' => 'Absconded',
            ],
        ];
    }
}