<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TaskTemplate extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'description', 'module', 'priority', 'metadata'];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(TaskTemplateItem::class);
    }
}
