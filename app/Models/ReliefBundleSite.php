<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Guards\ClientSite;

class ReliefBundleSite extends Model
{
    use HasFactory;

    protected $fillable = [
        'relief_bundle_id',
        'client_site_id',
        'position',
    ];

    public function bundle(): BelongsTo
    {
        return $this->belongsTo(ReliefBundle::class, 'relief_bundle_id');
    }

    public function site(): BelongsTo
    {
        return $this->belongsTo(ClientSite::class, 'client_site_id');
    }
}
