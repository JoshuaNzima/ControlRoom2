<?php

namespace App\AI\Tools;

use App\Models\HelpArticle;
use LaravelAIAgent\Attributes\AsAITool;

class FindRelevantHelpArticlesTool
{
    #[AsAITool('Find relevant Help Center articles for a user question')]
    public function find(
        string $context = 'general',
        string $userRole = 'user',
        string $query = ''
    ): array {
        $query = trim($query);
        $context = trim($context);

        $categoryMap = [
            'admin' => ['getting-started', 'guards', 'sites', 'settings'],
            'superadmin' => ['getting-started', 'settings', 'troubleshooting'],
            'control-room' => ['control-room', 'attendance', 'sites'],
            'hr' => ['hr', 'training', 'guards'],
            'finance' => ['finance', 'reports'],
            'assets' => ['assets'],
            'operations' => ['guards', 'control-room', 'attendance'],
            'supervisor' => ['supervisor', 'attendance', 'guards'],
            'zone-commander' => ['supervisor', 'guards', 'control-room'],
            'client' => ['client', 'general'],
            'landing' => ['general'],
            'dashboard' => ['getting-started'],
            'general' => ['general', 'getting-started'],
        ];

        $categories = $categoryMap[$context] ?? ['getting-started', 'general'];

        $q = HelpArticle::published()
            ->forRole($userRole)
            ->whereIn('category', $categories);

        if ($query !== '') {
            $q->where(function ($inner) use ($query) {
                $inner
                    ->where('title', 'LIKE', "%{$query}%")
                    ->orWhere('content', 'LIKE', "%{$query}%")
                    ->orWhereJsonContains('tags', $query);
            });
        }

        $articles = $q->orderBy('featured', 'desc')
            ->orderBy('view_count', 'desc')
            ->limit(5)
            ->get(['title', 'slug', 'category', 'video_url', 'tags']);

        return $articles->map(fn ($a) => [
            'title' => $a->title,
            'slug' => $a->slug,
            'category' => $a->category,
            'has_video' => !empty($a->video_url),
            'tags' => $a->tags,
        ])->toArray();
    }
}
