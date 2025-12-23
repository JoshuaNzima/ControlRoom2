<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\HR\HrPolicy;
use App\Models\HR\HrPolicyCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class PolicyController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->query('perPage', 12);
        $search = (string) $request->query('q', '');
        $categoryId = $request->query('category_id');

        $categories = HrPolicyCategory::orderBy('name')->get(['id','name','slug']);
        $policies = HrPolicy::with('category:id,name')
            ->where('published', true)
            ->when($search, function($q) use ($search) {
                $q->where('title', 'like', "%$search%")
                  ->orWhere('summary', 'like', "%$search%")
                  ->orWhere('content', 'like', "%$search%");
            })
            ->when($categoryId, fn($q) => $q->where('hr_policy_category_id', $categoryId))
            ->orderByDesc('effective_date')
            ->orderBy('title')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('Public/Policies/Index', [
            'categories' => $categories,
            'policies' => $policies,
            'filters' => [
                'q' => $search,
                'category_id' => $categoryId,
                'perPage' => $perPage,
            ],
        ]);
    }

    public function show(string $slug)
    {
        $policy = HrPolicy::with(['category:id,name,slug','files:id,hr_policy_id,filename,path'])
            ->where('slug', $slug)
            ->where('published', true)
            ->firstOrFail();

        return Inertia::render('Public/Policies/Show', [
            'policy' => [
                'id' => $policy->id,
                'title' => $policy->title,
                'slug' => $policy->slug,
                'version' => $policy->version,
                'effective_date' => optional($policy->effective_date)->toDateString(),
                'summary' => $policy->summary,
                'content' => $policy->content,
                'category' => $policy->category ? [
                    'id' => $policy->category->id,
                    'name' => $policy->category->name,
                    'slug' => $policy->category->slug,
                ] : null,
                'files' => $policy->files->map(function($f){
                    return [
                        'id' => $f->id,
                        'filename' => $f->filename,
                        'url' => Storage::disk('public')->url($f->path),
                    ];
                }),
            ],
        ]);
    }
}
