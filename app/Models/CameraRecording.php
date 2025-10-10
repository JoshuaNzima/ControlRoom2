<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CameraRecording extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'camera_id',
        'start_time',
        'end_time',
        'file_path',
        'size',
        'type',
        'trigger_type',
        'trigger_metadata',
        'status'
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'trigger_metadata' => 'json'
    ];

    const TYPES = ['continuous', 'motion', 'alert', 'manual'];
    const STATUSES = ['recording', 'completed', 'failed', 'archived'];
    const TRIGGER_TYPES = ['scheduled', 'motion', 'alert', 'manual'];

    public function camera()
    {
        return $this->belongsTo(Camera::class);
    }

    public function getDurationAttribute()
    {
        if (!$this->end_time) {
            return $this->start_time->diffInSeconds(now());
        }
        return $this->start_time->diffInSeconds($this->end_time);
    }

    public function getSizeFormatted()
    {
        $bytes = $this->size;
        $units = ['B', 'KB', 'MB', 'GB'];
        $i = 0;
        while ($bytes >= 1024 && $i < count($units) - 1) {
            $bytes /= 1024;
            $i++;
        }
        return round($bytes, 2) . ' ' . $units[$i];
    }
}