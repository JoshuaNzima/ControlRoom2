<?php

namespace App\Policies;

use App\Models\Document;
use App\Models\User;

class DocumentPolicy
{
    public function view(User $user, Document $document): bool
    {
        return $document->canAccess($user);
    }

    public function update(User $user, Document $document): bool
    {
        if ($user->hasRole('super_admin')) {
            return true;
        }

        if ($document->uploaded_by === $user->id) {
            return true;
        }

        $permission = $document->getPermission($user);
        return $permission === 'edit';
    }

    public function delete(User $user, Document $document): bool
    {
        if ($user->hasRole('super_admin')) {
            return true;
        }

        return $document->uploaded_by === $user->id;
    }
}
