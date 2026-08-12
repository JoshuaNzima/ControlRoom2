<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ScanTag extends Model
{
    use HasFactory;

    protected $fillable = [
        'checkpoint_scan_id',
        'tags',
    ];

    protected $casts = [
        'tags' => 'array',
    ];

    public function checkpointScan()
    {
        return $this->belongsTo(\App\Models\Guards\CheckpointScan::class, 'checkpoint_scan_id');
    }
}
