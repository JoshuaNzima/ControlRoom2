<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Mail;
use App\Mail\WelcomeEmail;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        // Auto-generate a unique employee_id for the user
        $employeeId = null;
        try {
            do {
                $candidate = 'EMP-'.now()->format('ym').'-'.sprintf('%04d', random_int(0, 9999));
            } while (User::where('employee_id', $candidate)->exists());
            $employeeId = $candidate;
        } catch (\Throwable $e) {
            // leave employee_id null if generation fails
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'employee_id' => $employeeId,
        ]);

        event(new Registered($user));

        try {
            Mail::to($user->email)->send(new WelcomeEmail($user));
        } catch (\Throwable $e) {
            // swallow mail errors
        }

        Auth::login($user);

        return redirect(route('dashboard', absolute: false));
    }
}
