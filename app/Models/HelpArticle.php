<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class HelpArticle extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'content',
        'video_url',
        'estimated_reading_time',
        'category',
        'tags',
        'target_roles',
        'is_published',
        'featured',
        'view_count',
        'created_by',
    ];

    protected $casts = [
        'tags' => 'array',
        'target_roles' => 'array',
        'is_published' => 'boolean',
        'featured' => 'boolean',
    ];

    const CATEGORIES = [
        'getting-started' => 'Getting Started',
        'guards' => 'Guard Management',
        'attendance' => 'Attendance & Check-ins',
        'sites' => 'Site Management',
        'control-room' => 'Control Room Operations',
        'finance' => 'Finance & Payroll',
        'assets' => 'Assets & Vehicles',
        'hr' => 'Human Resources',
        'training' => 'Training & Development',
        'supervisor' => 'Supervisor & Zone Management',
        'client' => 'Client Portal',
        'reports' => 'Reports & Analytics',
        'settings' => 'Settings & Configuration',
        'troubleshooting' => 'Troubleshooting',
        'general' => 'General',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($article) {
            if (empty($article->slug)) {
                $article->slug = Str::slug($article->title);
            }
        });
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function incrementViewCount()
    {
        $this->increment('view_count');
    }

    public function scopePublished($query)
    {
        return $query->where('is_published', true);
    }

    public function scopeFeatured($query)
    {
        return $query->where('featured', true);
    }

    public function scopeWithVideo($query)
    {
        return $query->whereNotNull('video_url');
    }

    /**
     * Check if article has a video tutorial.
     */
    public function hasVideo(): bool
    {
        return !empty($this->video_url);
    }

    /**
     * Get estimated reading time (auto-calculate if not set).
     */
    public function getReadingTimeAttribute(): int
    {
        if ($this->estimated_reading_time) {
            return $this->estimated_reading_time;
        }
        
        // Average reading speed: 200 words per minute
        $wordCount = str_word_count(strip_tags($this->content));
        return max(1, (int) ceil($wordCount / 200));
    }

    public function scopeCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    public function scopeSearch($query, $term)
    {
        return $query->where(function ($q) use ($term) {
            $q->where('title', 'LIKE', "%{$term}%")
                ->orWhere('content', 'LIKE', "%{$term}%")
                ->orWhereJsonContains('tags', $term);
        });
    }

    /**
     * Scope to filter articles by user role.
     * - null target_roles: visitors/guests only
     * - empty array: all authenticated users
     * - array with roles: only users with those roles
     */
    public function scopeForRole($query, ?string $role)
    {
        // Defensive: check if target_roles column exists (migration may not be run)
        if (!Schema::hasColumn('help_articles', 'target_roles')) {
            // Column doesn't exist - return all published articles (no role filtering)
            return $query;
        }

        return $query->where(function ($q) use ($role) {
            if ($role === null) {
                // Visitors/guests - show only articles with null target_roles
                $q->whereNull('target_roles');
            } elseif ($role === 'all') {
                // Show all articles (for admin management)
                // No filter
            } else {
                // Authenticated user - show articles for their role OR empty array (all users)
                $q->where(function ($subQ) use ($role) {
                    $subQ->whereJsonContains('target_roles', $role)
                        ->orWhere('target_roles', '[]')
                        ->orWhereJsonLength('target_roles', 0);
                });
            }
        });
    }
}
