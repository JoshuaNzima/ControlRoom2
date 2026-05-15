<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Document extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'description',
        'file_path',
        'original_filename',
        'mime_type',
        'file_size',
        'file_type',
        'category_id',
        'uploaded_by',
        'module',
        'department',
        'access_level',
        'tags',
        'expires_at',
        'is_archived',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'is_archived' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(DocumentCategory::class);
    }

    public function versions(): HasMany
    {
        return $this->hasMany(DocumentVersion::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(DocumentComment::class);
    }

    public function shares(): HasMany
    {
        return $this->hasMany(DocumentShare::class);
    }

    public function downloads(): HasMany
    {
        return $this->hasMany(DocumentDownload::class);
    }

    public function sharedWith(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'document_shares', 'document_id', 'user_id')
            ->withPivot('permission', 'shared_at');
    }

    public function isImage(): bool
    {
        return $this->file_type === 'image';
    }

    public function isVideo(): bool
    {
        return $this->file_type === 'video';
    }

    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    public function canAccess(User $user): bool
    {
        $isOwnerOrSuperAdmin = $this->uploaded_by === $user->id || $user->hasRole('super_admin');

        // Owners (and super admins) can always access, even if the document is expired.
        if ($isOwnerOrSuperAdmin) {
            return true;
        }

        // Non-owners cannot access expired documents.
        if ($this->isExpired()) {
            return false;
        }

        if ($this->access_level === 'public') {
            return true;
        }

        if ($this->access_level === 'module' && $user->hasModule($this->module)) {
            return true;
        }

        if ($this->access_level === 'department' && $user->department === $this->department) {
            return true;
        }

        return $this->sharedWith()->where('user_id', $user->id)->exists();
    }

    public function getPermission(User $user): ?string
    {
        if ($this->uploaded_by === $user->id) {
            return 'edit';
        }

        return $this->sharedWith()
            ->where('user_id', $user->id)
            ->value('permission');
    }

    public static function getModules(): array
    {
        return [
            'finance' => 'Finance',
            'hr' => 'Human Resources',
            'assets' => 'Assets Management',
            'control_room' => 'Control Room',
            'front_office' => 'Front Office',
            'maintenance' => 'Maintenance',
        ];
    }
}
