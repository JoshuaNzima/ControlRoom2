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
        'video_type',
        'order',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'order' => 'integer',
    ];

    // Supported dashboards - expanded for all modules
    public const DASHBOARDS = [
        'admin' => 'Admin Dashboard',
        'superadmin' => 'Super Admin Dashboard',
        'control-room' => 'Control Room Dashboard',
        'assets' => 'Assets Dashboard',
        'client' => 'Client Portal',
        'hr' => 'HR Module',
        'finance' => 'Finance Module',
        'operations' => 'Operations Module',
        'marketing' => 'Marketing Module',
        'training' => 'Training Module',
        'front-office' => 'Front Office Module',
        'business-dev' => 'Business Development Module',
        'supervisor' => 'Supervisor Module',
        'zone-commander' => 'Zone Commander Module',
    ];

    // Content types
    public const TYPE_VIDEO = 'video';
    public const TYPE_DOCUMENT = 'document';
    public const TYPE_TEXT = 'text';

    // Video types
    public const VIDEO_YOUTUBE = 'youtube';
    public const VIDEO_VIMEO = 'vimeo';
    public const VIDEO_UPLOAD = 'upload';

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
     * Get embed URL for video (YouTube/Vimeo) or file URL for uploaded videos.
     */
    public function getEmbedUrlAttribute(): ?string
    {
        if ($this->content_type !== self::TYPE_VIDEO) {
            return null;
        }

        // For uploaded videos, return the file URL
        if ($this->video_type === self::VIDEO_UPLOAD) {
            return $this->file_url;
        }

        // For YouTube/Vimeo, extract embed URL
        if (empty($this->video_url)) {
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
     * Check if video is uploaded (not embedded).
     */
    public function getIsUploadedVideoAttribute(): bool
    {
        return $this->content_type === self::TYPE_VIDEO && $this->video_type === self::VIDEO_UPLOAD;
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
