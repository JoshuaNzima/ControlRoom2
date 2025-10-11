<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CameraRecording extends Model
{
    use HasFactory;

    protected $fillable = [
        'camera_id',
        'filename',
        'file_path',
        'file_size',
        'duration',
        'start_time',
        'end_time',
        'type',
        'quality',
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
    ];

    public function camera(): BelongsTo
    {
        return $this->belongsTo(Camera::class);
    }
}