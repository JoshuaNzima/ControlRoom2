<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Http\Kernel::class);
$request = \Illuminate\Http\Request::create('/', 'GET');
$kernel->handle($request);

// Get all users and their roles
$users = \App\Models\User::with('roles')->take(5)->get();

echo "=== USERS AND ROLES ===\n";
foreach ($users as $user) {
    echo "\nUser: {$user->name} (ID: {$user->id}, Email: {$user->email})\n";
    $roles = $user->roles->pluck('name')->toArray();
    echo "  Roles: " . (empty($roles) ? '[NONE]' : implode(', ', $roles)) . "\n";
}

// Check if finance roles exist
$financeRoles = \Spatie\Permission\Models\Role::whereIn('name', ['finance_officer', 'accountant', 'admin', 'super_admin'])->pluck('name')->toArray();
echo "\n\n=== FINANCE ROLES IN DATABASE ===\n";
echo implode(', ', $financeRoles) . "\n";

// Check a specific user's permissions
if ($users->count() > 0) {
    $user = $users->first();
    echo "\n\n=== PERMISSIONS FOR {$user->name} ===\n";
    $perms = $user->getPermissionNames();
    echo $perms->count() . " permissions:\n";
    foreach ($perms->chunk(5) as $chunk) {
        echo "  " . implode(', ', $chunk->toArray()) . "\n";
    }
}

// Test finance.access gate
echo "\n\n=== TESTING GATE ===\n";
if ($users->count() > 0) {
    $user = $users->first();
    \Illuminate\Support\Facades\Auth::setUser($user);
    try {
        \Illuminate\Support\Facades\Gate::authorize('finance.access');
        echo "User '{$user->name}' CAN access finance\n";
    } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
        echo "User '{$user->name}' CANNOT access finance: " . $e->getMessage() . "\n";
    }
}
