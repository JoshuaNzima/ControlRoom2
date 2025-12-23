<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Guards\Guard;
use App\Models\Guards\ClientSite;

class RelieverRotation extends Model
{
    use HasFactory;

    protected $fillable = [
        'guard_id',
        'client_site_id',
        'date',
        'assigned_by',
        'notes',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    public function guardRelation(): BelongsTo
    {
        return $this->belongsTo(Guard::class);
    }

    public function site(): BelongsTo
    {
        return $this->belongsTo(ClientSite::class, 'client_site_id');
    }
}
