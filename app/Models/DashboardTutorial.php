<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class DashboardTutorial extends Model
{
    use HasFactory;

    protected $fillable = [
        'dashboard',
        'title',
        'description',
        'content_type',
        'content',
        'file_path',
        'video_url',
        'order',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'order' => 'integer',
    ];

    // Supported dashboards
    public const DASHBOARDS = [
        'admin' => 'Admin Dashboard',
        'superadmin' => 'Super Admin Dashboard',
        'control-room' => 'Control Room Dashboard',
        'assets' => 'Assets Dashboard',
        'client' => 'Client Portal',
    ];

    // Content types
    public const TYPE_VIDEO = 'video';
    public const TYPE_DOCUMENT = 'document';
    public const TYPE_TEXT = 'text';

    /**
     * Get the user who created this tutorial.
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the file URL for documents/videos.
     */
    public function getFileUrlAttribute(): ?string
    {
        if (empty($this->file_path)) {
            return null;
        }
        return asset('storage/' . ltrim($this->file_path, '/'));
    }

    /**
     * Get embed URL for video (YouTube/Vimeo).
     */
    public function getEmbedUrlAttribute(): ?string
    {
        if ($this->content_type !== self::TYPE_VIDEO || empty($this->video_url)) {
            return null;
        }

        $url = $this->video_url;

        // YouTube
        if (str_contains($url, 'youtube.com') || str_contains($url, 'youtu.be')) {
            $videoId = null;
            if (preg_match('/youtube\.com\/watch\?v=([^&]+)/', $url, $matches)) {
                $videoId = $matches[1];
            } elseif (preg_match('/youtu\.be\/([^?]+)/', $url, $matches)) {
                $videoId = $matches[1];
            }
            if ($videoId) {
                return "https://www.youtube.com/embed/{$videoId}";
            }
        }

        // Vimeo
        if (str_contains($url, 'vimeo.com')) {
            if (preg_match('/vimeo\.com\/(\d+)/', $url, $matches)) {
                return "https://player.vimeo.com/video/{$matches[1]}";
            }
        }

        // Return as-is for other embed URLs
        return $url;
    }

    /**
     * Scope to get tutorials for a specific dashboard.
     */
    public function scopeForDashboard($query, string $dashboard)
    {
        return $query->where('dashboard', $dashboard)
            ->where('is_active', true)
            ->orderBy('order')
            ->orderBy('created_at', 'desc');
    }

    /**
     * Scope to get active tutorials.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Delete associated file when model is deleted.
     */
    protected static function booted(): void
    {
        static::deleting(function (self $tutorial) {
            if ($tutorial->file_path) {
                Storage::disk('public')->delete($tutorial->file_path);
            }
        });
    }
}
