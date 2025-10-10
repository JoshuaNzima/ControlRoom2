<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CameraAlert extends Model
{
    protected $fillable = [
        'camera_id',
        'type',
        'description',
        'severity',
        'status',
        'metadata',
        'acknowledged_by',
        'acknowledged_at'
    ];

    protected $casts = [
        'metadata' => 'json',
        'acknowledged_at' => 'datetime'
    ];

    const TYPES = ['motion', 'tampering', 'offline', 'object_detected'];
    const SEVERITIES = ['low', 'medium', 'high', 'critical'];
    const STATUSES = ['active', 'acknowledged', 'resolved', 'false_alarm'];

    public function camera()
    {
        return $this->belongsTo(Camera::class);
    }

    public function acknowledgedBy()
    {
        return $this->belongsTo(User::class, 'acknowledged_by');
    }
}