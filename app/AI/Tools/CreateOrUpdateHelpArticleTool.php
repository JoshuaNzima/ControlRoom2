<?php

namespace App\AI\Tools;

use App\Models\HelpArticle;
use LaravelAIAgent\Attributes\AsAITool;

class CreateOrUpdateHelpArticleTool
{
    #[AsAITool('Create or update a Help Center guide (HelpArticle record)')]
    public function upsert(
        string $title,
        string $content,
        string $category = 'general',
        array $tags = [],
        array $target_roles = [],
        ?string $video_url = null,
        bool $is_published = true,
        bool $featured = false
    ): array {
        $title = trim($title);
        $content = trim($content);
        $category = trim($category);

        if ($title === '' || $content === '') {
            return [
                'ok' => false,
                'reason' => 'Missing title or content',
            ];
        }

        // Validate/normalize category to the known taxonomy.
        if (!array_key_exists($category, HelpArticle::CATEGORIES)) {
            // Keep behavior safe: coerce unknown categories to "general"
            $category = 'general';
        }

        // Normalize tags / roles (dedupe + cap sizes to avoid runaway storage)
        $tags = array_values(array_unique(array_filter(array_map('strval', $tags), fn ($t) => trim($t) !== '')));
        $target_roles = array_values(array_unique(array_filter(array_map('strval', $target_roles), fn ($r) => trim($r) !== '')));

        $tags = array_slice($tags, 0, 20);
        $target_roles = array_slice($target_roles, 0, 20);

        // Resolve slug from title (current identity strategy).
        // Note: we keep this to avoid changing data model semantics in this fix.
        $slug = HelpArticle::query()->firstWhere('title', $title)?->slug;
        if (empty($slug)) {
            $slug = \Illuminate\Support\Str::slug($title);
        }

        $article = HelpArticle::query()->firstWhere('slug', $slug);

        if (!$article) {
            $article = new HelpArticle();
            $article->slug = $slug;
        }

        $article->title = $title;
        $article->content = $content;
        $article->category = $category;
        $article->tags = $tags;
        $article->target_roles = $target_roles;
        $article->video_url = $video_url;
        $article->is_published = $is_published;
        $article->featured = $featured;

        // Keep view stats and created_by if updating an existing record
        if (!$article->exists) {
            $article->created_by = \auth()->id();
        }

        $article->save();

        return [
            'ok' => true,
            'article' => [
                'id' => $article->id,
                'title' => $article->title,
                'slug' => $article->slug,
                'category' => $article->category,
                'featured' => (bool) $article->featured,
                'is_published' => (bool) $article->is_published,
                'tags' => $article->tags,
                'video_url' => $article->video_url,
            ],
        ];
    }
}
