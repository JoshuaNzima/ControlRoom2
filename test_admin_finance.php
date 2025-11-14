<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Http\Kernel::class);
$request = \Illuminate\Http\Request::create('/', 'GET');
$kernel->handle($request);

// Test the admin user specifically
$adminUser = \App\Models\User::find(2);

if ($adminUser) {
    \Illuminate\Support\Facades\Auth::setUser($adminUser);
    
    echo "=== TESTING ADMIN USER ===\n";
    echo "User: {$adminUser->name} (ID: {$adminUser->id})\n";
    echo "Roles: " . implode(', ', $adminUser->roles->pluck('name')->toArray()) . "\n";
    echo "Has admin role: " . ($adminUser->hasRole('admin') ? 'YES' : 'NO') . "\n";
    
    try {
        \Illuminate\Support\Facades\Gate::authorize('finance.access');
        echo "Can access finance: YES ✓\n";
    } catch (\Exception $e) {
        echo "Can access finance: NO - {$e->getMessage()}\n";
    }
}
