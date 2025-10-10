<?php

namespace App\Models\Core;

use Illuminate\Database\Eloquent\Model;

class Module extends Model
{
    protected $fillable = [
        'name',
        'display_name',
        'description',
        'icon',
        'color',
        'is_active',
        'is_core',
        'config',
        'sort_order',
        'version',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_core' => 'boolean',
        'config' => 'array',
    ];

    public function users()
    {
        return $this->belongsToMany(User::class, 'user_modules')
                    ->withPivot('has_access', 'preferences')
                    ->withTimestamps();
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
    public function scopeForUser($query, $userId)
    {
        return $query->whereHas('users', function ($q) use ($userId) {
            $q->where('user_id', $userId)->where('has_access', true);
        });
    }
}
