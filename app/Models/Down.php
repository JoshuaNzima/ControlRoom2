<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Down extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'client_id',
        'client_site_id',
        'reported_by',
        'type',
        'title',
        'description',
        'status',
        'escalation_level',
        'resolved_at',
        'resolved_by',
        'resolution_notes',
    ];

    protected $casts = [
        'resolved_at' => 'datetime',
    ];

    public function reporter()
    {
        return $this->belongsTo(User::class, 'reported_by');
    }

    public function resolver()
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }

    public function client()
    {
        return $this->belongsTo(\App\Models\Guards\Client::class, 'client_id');
    }

    public function clientSite()
    {
        return $this->belongsTo(\App\Models\Guards\ClientSite::class, 'client_site_id');
    }
}


