<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssetHandover extends Model
{
    use HasFactory;

    protected $fillable = [
        'asset_type',
        'asset_id',
        'handed_over_by',
        'handed_to',
        'condition_out',
        'serial',
        'color',
        'notes_out',
        'condition_in',
        'notes_in',
        'returned_at',
    ];

    protected $casts = [
        'returned_at' => 'datetime',
    ];

    public function handedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'handed_over_by');
    }

    public function handedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'handed_to');
    }
}
