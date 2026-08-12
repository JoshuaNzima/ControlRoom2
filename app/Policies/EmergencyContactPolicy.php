<?php

namespace App\Policies;

use App\Models\EmergencyContact;
use App\Models\User;

class EmergencyContactPolicy
{
    public function viewAny(User $user): bool
    {
        return true; // All authenticated users can view emergency contacts
    }

    public function view(User $user, EmergencyContact $emergencyContact): bool
    {
        return true; // All authenticated users can view emergency contacts
    }

    public function create(User $user): bool
    {
        return $user->hasRole(['super_admin', 'admin']);
    }

    public function update(User $user, EmergencyContact $emergencyContact): bool
    {
        return $user->hasRole(['super_admin', 'admin']);
    }

    public function delete(User $user, EmergencyContact $emergencyContact): bool
    {
        return $user->hasRole(['super_admin', 'admin']);
    }

    public function manage(User $user): bool
    {
        return $user->hasRole(['super_admin', 'admin']);
    }
}
