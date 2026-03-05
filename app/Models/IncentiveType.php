<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class IncentiveType extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'category',
        'applies_to',
        'is_active',
        'requires_approval',
        'default_config',
        'sort_order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'requires_approval' => 'boolean',
        'default_config' => 'json',
        'sort_order' => 'integer',
    ];

    public function rules(): HasMany
    {
        return $this->hasMany(IncentiveRule::class);
    }

    public function profiles(): HasMany
    {
        return $this->hasMany(GuardIncentiveProfile::class);
    }

    public function records(): HasMany
    {
        return $this->hasMany(IncentiveRecord::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    public function scopeAppliesTo($query, string $appliesTo)
    {
        return $query->where(function ($q) use ($appliesTo) {
            $q->where('applies_to', 'all')
              ->orWhere('applies_to', $appliesTo);
        });
    }
}
