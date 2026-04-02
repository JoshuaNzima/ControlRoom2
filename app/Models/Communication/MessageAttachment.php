<?php

namespace App\Models\Communication;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class MessageAttachment extends Model
{
    protected $fillable = [
        'message_id',
        'file_name',
        'file_path',
        'file_type',
        'file_size',
    ];

    protected $casts = [
        'file_size' => 'integer',
    ];

    public function message()
    {
        return $this->belongsTo(Message::class);
    }

    public function getUrlAttribute()
    {
        return route('messages.attachments.download', $this);
    }

    public function getFormattedSizeAttribute()
    {
        $bytes = $this->file_size;
        $units = ['B', 'KB', 'MB', 'GB'];
        $unitIndex = 0;

        while ($bytes >= 1024 && $unitIndex < count($units) - 1) {
            $bytes /= 1024;
            $unitIndex++;
        }

        return round($bytes, 2) . ' ' . $units[$unitIndex];
    }

    public function getIsImageAttribute()
    {
        return str_starts_with($this->file_type, 'image/');
    }

    public function deleteFile()
    {
        if ($this->file_path) {
            Storage::disk('private')->delete($this->file_path);
        }
    }

    protected static function booted()
    {
        static::deleting(function ($attachment) {
            $attachment->deleteFile();
        });
    }
}
