<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use App\Http\Requests\ProfileAvatarRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): RedirectResponse
    {
        return Redirect::route('profile.dashboard');
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return Redirect::route('profile.edit');
    }


    /**
     * Update the user's avatar image.
     */
    public function updateAvatar(ProfileAvatarRequest $request): RedirectResponse
    {
        $user = $request->user();
        $file = $request->file('avatar');
        if (!$file) {
            return Redirect::back();
        }

        $old = $user->avatar_path;
        $path = $file->store('avatars', 'public');
        $user->avatar_path = $path;
        $user->save();

        if ($old && $old !== $path) {
            try { Storage::disk('public')->delete($old); } catch (\Throwable $e) {}
        }

        return Redirect::back();
    }
}
