<?php

namespace App\Http\Controllers\FrontOffice;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        
        $roleLabels = [
            'executive_assistant' => 'Executive Assistant',
            'personal_assistant' => 'Personal Assistant',
            'receptionist' => 'Receptionist',
            'admin' => 'Administrator',
            'super_admin' => 'Super Admin',
        ];

        $role = $user->roles->first()?->name ?? 'receptionist';

        return Inertia::render('FrontOffice/Profile', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'department' => $user->department,
                'role' => $role,
                'avatar' => $user->avatar,
                'created_at' => $user->created_at->toISOString(),
            ],
            'roleLabel' => $roleLabels[$role] ?? 'Staff',
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email,' . $request->user()->id,
            'phone' => 'nullable|string|max:20',
            'department' => 'nullable|string|max:100',
        ]);

        $request->user()->update($validated);

        return back()->with('success', 'Profile updated successfully.');
    }

    public function updatePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => 'required|current_password',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $request->user()->update([
            'password' => bcrypt($validated['password']),
        ]);

        return back()->with('success', 'Password updated successfully.');
    }
}
