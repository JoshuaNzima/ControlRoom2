<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Module extends Model
{
    use HasFactory;

    protected $fillable = [
        'display_name',
        'version',
        'is_active',
        'is_core',
        'description',
        'category',
        'icon',
        'route',
        'order',
        'settings',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_core' => 'boolean',
        'settings' => 'array',
    ];

    public const CATEGORIES = [
        'hr' => 'HR Management',
        'finance' => 'Finance',
        'admin' => 'Administration',
        'marketing' => 'Marketing',
        'analytics' => 'Analytics',
        'system' => 'System',
    ];
}