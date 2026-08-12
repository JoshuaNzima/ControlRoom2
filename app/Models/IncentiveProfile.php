<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class IncentiveProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'role',
        'base_amount',
        'penalty_per_unresolved_down',
        'is_active',
        'description',
    ];

    protected $casts = [
        'base_amount' => 'decimal:2',
        'penalty_per_unresolved_down' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForRole($query, string $role)
    {
        return $query->where('role', $role);
    }

    // Get active profile for a role
    public static function getActiveForRole(string $role): ?self
    {
        return self::active()->forRole($role)->first();
    }
}
