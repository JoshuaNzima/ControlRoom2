<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\HrPolicy;
use App\Models\HR\HrPolicyCategory;
use App\Models\HR\HrPolicyFile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class HrPolicyController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->query('perPage', 15);
        $search = (string) $request->query('q', '');
        $categoryId = $request->query('category_id');
        $published = $request->query('published');

        $categories = HrPolicyCategory::orderBy('name')->get(['id','name','slug']);
        $policies = HrPolicy::with(['category:id,name', 'files:id,hr_policy_id,filename,path,mime_type,size'])
            ->when($search, function($q) use ($search) {
                $q->where('title', 'like', "%$search%")
                  ->orWhere('summary', 'like', "%$search%")
                  ->orWhere('content', 'like', "%$search%");
            })
            ->when($categoryId, fn($q) => $q->where('hr_policy_category_id', $categoryId))
            ->when($published !== null && $published !== '', function($q) use ($published) {
                $q->where('published', filter_var($published, FILTER_VALIDATE_BOOLEAN));
            })
            ->orderByDesc('effective_date')
            ->orderBy('title')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('HR/Policies', [
            'categories' => $categories,
            'policies' => $policies,
            'filters' => [
                'q' => $search,
                'category_id' => $categoryId,
                'published' => $published,
                'perPage' => $perPage,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'hr_policy_category_id' => ['nullable','exists:hr_policy_categories,id'],
            'title' => ['required','string','max:255'],
            'slug' => ['nullable','string','max:255','unique:hr_policies,slug'],
            'version' => ['nullable','string','max:100'],
            'effective_date' => ['nullable','date'],
            'published' => ['boolean'],
            'summary' => ['nullable','string'],
            'content' => ['nullable','string'],
        ]);
        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['title']);
        }
        $policy = HrPolicy::create($data);
        return back()->with('success', 'Policy created');
    }

    public function update(Request $request, HrPolicy $policy)
    {
        $data = $request->validate([
            'hr_policy_category_id' => ['nullable','exists:hr_policy_categories,id'],
            'title' => ['required','string','max:255'],
            'slug' => ['required','string','max:255','unique:hr_policies,slug,'.$policy->id],
            'version' => ['nullable','string','max:100'],
            'effective_date' => ['nullable','date'],
            'published' => ['boolean'],
            'summary' => ['nullable','string'],
            'content' => ['nullable','string'],
        ]);
        $policy->update($data);
        return back()->with('success', 'Policy updated');
    }

    public function destroy(HrPolicy $policy)
    {
        $policy->delete();
        return back()->with('success', 'Policy deleted');
    }

    public function togglePublish(HrPolicy $policy)
    {
        $policy->published = !$policy->published;
        $policy->save();
        return back()->with('success', 'Publish state updated');
    }

    public function storeCategory(Request $request)
    {
        $data = $request->validate([
            'name' => ['required','string','max:255'],
            'slug' => ['nullable','string','max:255','unique:hr_policy_categories,slug'],
            'description' => ['nullable','string'],
        ]);
        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }
        HrPolicyCategory::create($data);
        return back()->with('success', 'Category created');
    }

    public function updateCategory(Request $request, HrPolicyCategory $category)
    {
        $data = $request->validate([
            'name' => ['required','string','max:255'],
            'slug' => ['required','string','max:255','unique:hr_policy_categories,slug,'.$category->id],
            'description' => ['nullable','string'],
        ]);
        $category->update($data);
        return back()->with('success', 'Category updated');
    }

    public function destroyCategory(HrPolicyCategory $category)
    {
        $category->delete();
        return back()->with('success', 'Category deleted');
    }

    public function storeFile(Request $request, HrPolicy $policy)
    {
        $data = $request->validate([
            'file' => ['required','file','max:20480'],
        ]);
        $file = $data['file'];
        $path = $file->store('policies', 'public');
        HrPolicyFile::create([
            'hr_policy_id' => $policy->id,
            'filename' => $file->getClientOriginalName(),
            'path' => $path,
            'mime_type' => $file->getClientMimeType(),
            'size' => $file->getSize(),
        ]);
        return back()->with('success', 'File uploaded');
    }

    public function destroyFile(HrPolicyFile $file)
    {
        if ($file->path && Storage::disk('public')->exists($file->path)) {
            Storage::disk('public')->delete($file->path);
        }
        $file->delete();
        return back()->with('success', 'File removed');
    }
}
