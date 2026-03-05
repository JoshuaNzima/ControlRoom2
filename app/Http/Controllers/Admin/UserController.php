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
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use App\Mail\WelcomeEmail;

class UserController extends Controller
{
    private function redirectAfterWrite(Request $request)
    {
        $referer = (string) $request->headers->get('referer', '');
        $path = parse_url($referer, PHP_URL_PATH) ?: '';

        if (str_starts_with($path, '/superadmin/users')) {
            return redirect()->route('superadmin.users');
        }

        return redirect()->route('admin.users.index');
    }

    public function index()
    {
        $perPage = request('per_page', 20);
        $sortField = request('sort', 'name');
        $sortDirection = request('direction', 'asc');

        $allowedSorts = ['name', 'email', 'created_at', 'status'];
        if (!in_array($sortField, $allowedSorts)) {
            $sortField = 'name';
        }

        $users = User::with('roles', 'zone')
            ->when(request('search'), function($q, $search) {
                $q->where(function($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                          ->orWhere('email', 'like', "%{$search}%")
                          ->orWhere('employee_id', 'like', "%{$search}%")
                          ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->when(request('role'), function($q, $role) {
                $q->whereHas('roles', function($query) use ($role) {
                    $query->where('name', $role);
                });
            })
            ->when(request('status'), function($q, $status) {
                $q->where('status', $status);
            })
            ->when(request('zone_id'), function($q, $zoneId) {
                $q->where('zone_id', $zoneId);
            })
            ->orderBy($sortField, $sortDirection)
            ->paginate($perPage)
            ->withQueryString();

        $roles = Role::all();
        $zones = Zone::orderBy('name')->get(['id','name']);

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'filters' => request()->only('search', 'per_page', 'role', 'status', 'zone_id', 'sort', 'direction'),
            'roles' => $roles,
            'zones' => $zones,
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
            'phone' => 'nullable|string',
            'employee_id' => 'nullable|string|unique:users',
            'role' => 'required|exists:roles,name',
            'zone_id' => 'nullable|exists:zones,id',
            'status' => 'nullable|in:active,inactive',
        ]);

        // Auto-generate employee_id if not provided
        if (empty($validated['employee_id'])) {
            $validated['employee_id'] = $this->generateUserEmployeeId();
        }

        // Generate a random temporary password
        $tempPassword = Str::random(16);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($tempPassword),
            'phone' => $validated['phone'] ?? null,
            'employee_id' => $validated['employee_id'] ?? null,
            'status' => $validated['status'] ?? 'active',
            'zone_id' => $validated['zone_id'] ?? null,
        ]);

        $user->assignRole($validated['role']);

        // Send password reset link to user so they can set their own password
        try {
            Password::sendResetLink(['email' => $user->email]);
        } catch (\Throwable $e) {
            // Log error but don't fail user creation
            \Illuminate\Support\Facades\Log::warning('Failed to send password reset link to new user: ' . $user->email . ' - ' . $e->getMessage());
        }

        return $this->redirectAfterWrite($request)
            ->with('success', 'User created successfully. A password reset email has been sent to set their password.');
    }

    private function generateUserEmployeeId(): string
    {
        do {
            $candidate = 'EMP-'.now()->format('ym').'-'.sprintf('%04d', random_int(0, 9999));
        } while (User::where('employee_id', $candidate)->exists());
        return $candidate;
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

        return $this->redirectAfterWrite($request)
            ->with('success', 'User updated successfully.');
    }

    public function destroy(User $user)
    {
        $user->delete();

        return $this->redirectAfterWrite(request())
            ->with('success', 'User deleted successfully.');
    }
}