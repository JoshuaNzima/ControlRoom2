<?php

namespace App\Policies;

use App\Models\DocumentComment;
use App\Models\User;

class DocumentCommentPolicy
{
    public function delete(User $user, DocumentComment $comment): bool
    {
        if ($user->hasRole('super_admin')) {
            return true;
        }

        return $comment->user_id === $user->id || $comment->document->uploaded_by === $user->id;
    }
}
