<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;
use App\Models\Zone;
use App\Notifications\ZoneCommanderUnassigned;
use Illuminate\Support\Facades\Notification as NotificationFacade;

class UserController extends Controller
{
    public function index()
    {
        $users = User::with('roles')
            ->when(request('search'), function($q, $search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            })
            ->orderBy('name')
            ->paginate(20);

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'filters' => request()->only('search'),
        ]);
    }

    public function create()
    {
        $roles = Role::all();
        $zones = Zone::orderBy('name')->get();
        
        return Inertia::render('Admin/Users/Create', [
            'roles' => $roles,
            'zones' => $zones,
        ]);
    }

    public function edit(User $user)
    {
        $roles = Role::all();
        $zones = Zone::orderBy('name')->get();

        return Inertia::render('Admin/Users/Edit', [
            'user' => $user->load('roles'),
            'roles' => $roles,
            'zones' => $zones,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'phone' => 'nullable|string',
            'employee_id' => 'nullable|string|unique:users',
            'role' => 'required|exists:roles,name',
            'zone_id' => 'nullable|exists:zones,id',
            'status' => 'nullable|in:active,inactive',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'phone' => $validated['phone'] ?? null,
            'employee_id' => $validated['employee_id'] ?? null,
            'status' => $validated['status'] ?? 'active',
            'zone_id' => $validated['zone_id'] ?? null,
        ]);

        $user->assignRole($validated['role']);

        return redirect()->route('admin.users.index')
            ->with('success', 'User created successfully.');
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:8|confirmed',
            'phone' => 'nullable|string',
            'employee_id' => 'nullable|string|unique:users,employee_id,' . $user->id,
            'role' => 'nullable|exists:roles,name',
            'status' => 'nullable|in:active,inactive',
            'zone_id' => 'nullable|exists:zones,id',
        ]);

        if (isset($validated['name'])) $user->name = $validated['name'];
        if (isset($validated['email'])) $user->email = $validated['email'];
        if (isset($validated['password'])) $user->password = Hash::make($validated['password']);
        if (isset($validated['phone'])) $user->phone = $validated['phone'];
        if (isset($validated['employee_id'])) $user->employee_id = $validated['employee_id'];
        if (isset($validated['status'])) $user->status = $validated['status'];
        if (array_key_exists('zone_id', $validated)) {
            $user->zone_id = $validated['zone_id'];
        }

        $user->save();

        if (!empty($validated['role'])) {
            $user->syncRoles([$validated['role']]);
            // If the user is a zone_commander but has no zone assigned, notify admins
            if ($validated['role'] === 'zone_commander' && !$user->zone_id) {
                if (\Illuminate\Support\Facades\Schema::hasTable('notifications')) {
                    $admins = \App\Models\User::role('admin')->get();
                    NotificationFacade::send($admins, new ZoneCommanderUnassigned($user));
                } else {
                    // Fallback: log so admins can be informed via logs until notifications table exists
                    \Illuminate\Support\Facades\Log::warning('ZoneCommander without zone assigned: ' . $user->email);
                }
            }
        }

        return redirect()->route('admin.users.index')
            ->with('success', 'User updated successfully.');
    }

    public function destroy(User $user)
    {
        $user->delete();

        return redirect()->route('admin.users.index')
            ->with('success', 'User deleted successfully.');
    }
}