<?php

namespace App\Http\Controllers;

use App\Models\HelpArticle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class HelpController extends Controller
{
    /**
     * Display the help center page.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $userRole = $user?->roles()->first()?->name ?? null;

        $query = HelpArticle::query()->published()->forRole($userRole);

        if ($request->search) {
            $query->search($request->search);
        }

        if ($request->category) {
            $query->category($request->category);
        }

        $articles = $query->orderBy('view_count', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate(12);

        $categories = HelpArticle::CATEGORIES;

        $popularArticles = HelpArticle::published()
            ->forRole($userRole)
            ->orderBy('view_count', 'desc')
            ->limit(5)
            ->get(['id', 'title', 'slug', 'category']);

        return Inertia::render('Help/Index', [
            'articles' => $articles,
            'categories' => $categories,
            'popularArticles' => $popularArticles,
            'filters' => [
                'search' => $request->search,
                'category' => $request->category,
            ],
            'isAuthenticated' => (bool) $user,
            'userRole' => $userRole,
        ]);
    }

    /**
     * Display a specific help article.
     */
    public function show(string $slug)
    {
        $user = Auth::user();
        $userRole = $user?->roles()->first()?->name ?? null;

        $article = HelpArticle::where('slug', $slug)
            ->published()
            ->firstOrFail();

        $article->incrementViewCount();

        $relatedArticles = HelpArticle::published()
            ->where('category', $article->category)
            ->where('id', '!=', $article->id)
            ->forRole($userRole)
            ->limit(5)
            ->get(['id', 'title', 'slug', 'category']);

        return Inertia::render('Help/Show', [
            'article' => $article,
            'relatedArticles' => $relatedArticles,
            'isAuthenticated' => (bool) $user,
            'userRole' => $userRole,
        ]);
    }

    /**
     * Search help articles via API.
     */
    public function search(Request $request)
    {
        $request->validate([
            'q' => 'required|string|min:2|max:100',
        ]);

        $articles = HelpArticle::published()
            ->search($request->q)
            ->orderBy('view_count', 'desc')
            ->limit(10)
            ->get(['id', 'title', 'slug', 'category']);

        return response()->json([
            'success' => true,
            'articles' => $articles,
        ]);
    }

    /**
     * Get articles by category.
     */
    public function byCategory(string $category)
    {
        if (!isset(HelpArticle::CATEGORIES[$category])) {
            abort(404);
        }

        $articles = HelpArticle::published()
            ->category($category)
            ->orderBy('created_at', 'desc')
            ->paginate(12);

        return Inertia::render('Help/Category', [
            'articles' => $articles,
            'category' => $category,
            'categoryName' => HelpArticle::CATEGORIES[$category],
        ]);
    }
}
