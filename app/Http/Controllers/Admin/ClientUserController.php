<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ClientUserController extends Controller
{
    /**
     * Display a listing of client users.
     */
    public function index(Request $request)
    {
        $perPage = (int) ($request->input('per_page', 20));
        $search = $request->input('search');
        $statusFilter = $request->input('status');
        $clientFilter = $request->input('client_id');

        $users = User::whereHas('roles', function ($q) {
                $q->where('name', 'client');
            })
            ->with(['clients' => function ($q) {
                $q->select('clients.id', 'clients.name', 'clients.status');
            }])
            ->when($search, function ($q, $search) {
                $q->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->when($statusFilter, function ($q, $status) {
                $q->where('status', $status);
            })
            ->when($clientFilter, function ($q, $clientId) {
                $q->whereHas('clients', function ($q) use ($clientId) {
                    $q->where('clients.id', $clientId);
                });
            })
            ->orderByDesc('created_at')
            ->paginate($perPage)
            ->withQueryString();

        $clients = Client::orderBy('name')->get(['id', 'name', 'status']);

        // Get clients without users for the create form
        $clientsWithoutUsers = Client::whereDoesntHave('users')
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Admin/ClientUsers/Index', [
            'users' => $users,
            'filters' => $request->only(['search', 'per_page', 'status', 'client_id']),
            'clients' => $clients,
            'clientsWithoutUsers' => $clientsWithoutUsers,
        ]);
    }

    /**
     * Create a new client user for an existing client.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'client_id' => ['required', 'exists:clients,id'],
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:20'],
            'client_role' => ['nullable', 'in:primary,contact,viewer'],
        ]);

        $client = Client::findOrFail($validated['client_id']);

        // Generate a random temporary password
        $tempPassword = Str::random(16);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'password' => \Illuminate\Support\Facades\Hash::make($tempPassword),
            'status' => 'active',
        ]);

        // Assign client role
        $user->assignRole('client');

        // Link user to client
        $user->clients()->attach($client->id, [
            'role' => $validated['client_role'] ?? 'contact',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Send password reset link
        try {
            Password::sendResetLink(['email' => $user->email]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Failed to send password reset link to new client user: ' . $user->email . ' - ' . $e->getMessage());
        }

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => "Client user created successfully. A password reset email has been sent to {$user->email}.",
            ]);
        }

        return redirect()->back()->with('success', "Client user created successfully. A password reset email has been sent to {$user->email}.");
    }

    /**
     * Toggle client user status.
     */
    public function toggleStatus(Request $request, User $user)
    {
        // Ensure user is a client
        if (!$user->hasRole('client')) {
            return back()->withErrors(['message' => 'Only client users can be managed here.']);
        }

        $validated = $request->validate([
            'status' => ['required', 'in:active,inactive'],
        ]);

        $user->update(['status' => $validated['status']]);

        $message = $validated['status'] === 'active'
            ? "User '{$user->name}' has been activated."
            : "User '{$user->name}' has been deactivated.";

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'status' => $validated['status'],
                'message' => $message,
            ]);
        }

        return redirect()->back()->with('success', $message);
    }

    /**
     * Send password reset link to client user.
     */
    public function sendResetLink(Request $request, User $user)
    {
        // Ensure user is a client
        if (!$user->hasRole('client')) {
            return back()->withErrors(['message' => 'Only client users can be managed here.']);
        }

        try {
            Password::sendResetLink(['email' => $user->email]);
            $message = "Password reset email sent to {$user->email}.";
        } catch (\Throwable $e) {
            return back()->withErrors(['message' => 'Failed to send password reset email.']);
        }

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json(['success' => true, 'message' => $message]);
        }

        return redirect()->back()->with('success', $message);
    }

    /**
     * Remove client user.
     */
    public function destroy(Request $request, User $user)
    {
        // Ensure user is a client
        if (!$user->hasRole('client')) {
            return back()->withErrors(['message' => 'Only client users can be managed here.']);
        }

        $userName = $user->name;

        // Detach from clients
        $user->clients()->detach();

        // Delete user
        $user->delete();

        $message = "User '{$userName}' has been deleted.";

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json(['success' => true, 'message' => $message]);
        }

        return redirect()->back()->with('success', $message);
    }
}
