<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\DocumentCategory;
use App\Models\DocumentComment;
use App\Models\DocumentVersion;
use App\Models\DocumentShare;
use App\Models\DocumentDownload;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class DocumentController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');

        // Shared documents should not be available to the "client" role.
        // (Ensures it works consistently across all modules' frontends/navs.)
        $this->middleware(function ($request, $next) {
            $user = $request->user();
            if ($user && $user->hasRole('client')) {
                abort(403, 'Unauthorized. Documents are not available for client users.');
            }
            return $next($request);
        });
    }

    public function index(Request $request)
    {
        $query = Document::query()
            ->where('access_level', 'public')
            ->orWhere('uploaded_by', auth()->id())
            ->orWhere('department', auth()->user()->department)
            ->orWhereHas('sharedWith', function ($q) {
                $q->where('user_id', auth()->id());
            });

        // Apply filters
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->whereFullText('title', $request->search)
                    ->orWhereFullText('description', $request->search)
                    ->orWhereFullText('tags', $request->search);
            });
        }

        if ($request->filled('category')) {
            $query->where('category_id', $request->category);
        }

        if ($request->filled('file_type')) {
            $query->where('file_type', $request->file_type);
        }

        if ($request->filled('module')) {
            $query->where('module', $request->module);
        }

        if ($request->filled('sort')) {
            $sort = $request->sort;
            if ($sort === 'newest') {
                $query->orderByDesc('created_at');
            } elseif ($sort === 'oldest') {
                $query->orderBy('created_at');
            } elseif ($sort === 'most_downloaded') {
                $query->withCount('downloads')
                    ->orderByDesc('downloads_count');
            } elseif ($sort === 'name') {
                $query->orderBy('title');
            }
        } else {
            $query->orderByDesc('created_at');
        }

        $documents = $query->paginate(20);

        return Inertia::render('Documents/Index', [
            'documents' => $documents,
            'categories' => DocumentCategory::all(),
            'modules' => Document::getModules(),
            'fileTypes' => [
                'image' => 'Images',
                'video' => 'Videos',
                'document' => 'Documents',
                'archive' => 'Archives',
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('Documents/Create', [
            'categories' => DocumentCategory::all(),
            'modules' => Document::getModules(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'file' => 'required|file|max:512000',
            'category_id' => 'required|exists:document_categories,id',
            'module' => 'required|in:finance,hr,assets,control_room,front_office,maintenance',
            'access_level' => 'required|in:private,department,module,public',
            'tags' => 'nullable|string',
            'expires_at' => 'nullable|date|after:today',
        ]);

        $file = $request->file('file');
        $mimeType = $file->getMimeType();
        $fileType = $this->getFileType($mimeType);

        $path = $file->storeAs(
            "documents/{$validated['module']}/{now()->format('Y/m')}",
            uniqid() . '_' . $file->getClientOriginalName(),
            'public'
        );

        $document = Document::create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'file_path' => $path,
            'original_filename' => $file->getClientOriginalName(),
            'mime_type' => $mimeType,
            'file_size' => $file->getSize(),
            'file_type' => $fileType,
            'category_id' => $validated['category_id'],
            'uploaded_by' => auth()->id(),
            'module' => $validated['module'],
            'department' => auth()->user()->department,
            'access_level' => $validated['access_level'],
            'tags' => $validated['tags'] ?? null,
            'expires_at' => $validated['expires_at'] ?? null,
        ]);

        DocumentVersion::create([
            'document_id' => $document->id,
            'file_path' => $path,
            'file_size' => $file->getSize(),
            'mime_type' => $mimeType,
            'version_number' => 1,
            'created_by' => auth()->id(),
            'change_log' => 'Initial upload',
        ]);

        return redirect()->route('documents.show', $document)->with('success', 'Document uploaded successfully');
    }

    public function show(Document $document)
    {
        Gate::authorize('view', $document);

        $document->load([
            'category',
            'uploader',
            'comments.user',
            'versions.createdBy',
            'shares.user',
        ]);

        return Inertia::render('Documents/Show', [
            'document' => $document,
            'isOwner' => $document->uploaded_by === auth()->id(),
            'permission' => $document->getPermission(auth()->user()),
        ]);
    }

    public function edit(Document $document)
    {
        Gate::authorize('update', $document);

        return Inertia::render('Documents/Edit', [
            'document' => $document,
            'categories' => DocumentCategory::all(),
            'modules' => Document::getModules(),
        ]);
    }

    public function update(Request $request, Document $document)
    {
        Gate::authorize('update', $document);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'category_id' => 'required|exists:document_categories,id',
            'access_level' => 'required|in:private,department,module,public',
            'tags' => 'nullable|string',
            'expires_at' => 'nullable|date|after:today',
        ]);

        $document->update($validated);

        return redirect()->route('documents.show', $document)->with('success', 'Document updated successfully');
    }

    public function destroy(Document $document)
    {
        Gate::authorize('delete', $document);

        Storage::disk('public')->delete($document->file_path);

        $document->delete();

        return redirect()->route('documents.index')->with('success', 'Document deleted successfully');
    }

    public function download(Document $document)
    {
        Gate::authorize('view', $document);

        DocumentDownload::create([
            'document_id' => $document->id,
            'user_id' => auth()->id(),
            'ip_address' => request()->ip(),
            'user_agent' => request()->header('User-Agent'),
        ]);

        $document->increment('download_count');

        return Storage::disk('public')->download($document->file_path, $document->original_filename);
    }

    public function preview(Document $document)
    {
        Gate::authorize('view', $document);

        if (!$document->isImage() && !$document->isVideo()) {
            abort(403, 'Preview not available for this file type');
        }

        return Storage::disk('public')->response($document->file_path);
    }

    public function addComment(Request $request, Document $document)
    {
        Gate::authorize('view', $document);

        $validated = $request->validate([
            'comment' => 'required|string|max:1000',
            'parent_id' => 'nullable|exists:document_comments,id',
        ]);

        $comment = DocumentComment::create([
            'document_id' => $document->id,
            'user_id' => auth()->id(),
            'comment' => $validated['comment'],
            'parent_id' => $validated['parent_id'] ?? null,
        ]);

        $comment->load('user');

        $document->increment('comments_count');

        return response()->json($comment);
    }

    public function deleteComment(DocumentComment $comment)
    {
        Gate::authorize('delete', $comment);

        $document = $comment->document;
        $comment->delete();
        $document->decrement('comments_count');

        return response()->json(['success' => true]);
    }

    public function share(Request $request, Document $document)
    {
        Gate::authorize('update', $document);

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'permission' => 'required|in:view,edit',
        ]);

        DocumentShare::updateOrCreate(
            [
                'document_id' => $document->id,
                'user_id' => $validated['user_id'],
            ],
            [
                'permission' => $validated['permission'],
                'shared_by' => auth()->id(),
                'shared_at' => now(),
            ]
        );

        return response()->json(['success' => true]);
    }

    public function revokeShare(DocumentShare $share)
    {
        $document = $share->document;
        Gate::authorize('update', $document);

        $share->delete();

        return response()->json(['success' => true]);
    }

    public function createVersion(Request $request, Document $document)
    {
        Gate::authorize('update', $document);

        $validated = $request->validate([
            'file' => 'required|file|max:512000',
            'change_log' => 'nullable|string|max:500',
        ]);

        $file = $request->file('file');
        $mimeType = $file->getMimeType();

        $versionNumber = $document->versions()->max('version_number') + 1;

        $path = $file->storeAs(
            "documents/{$document->module}/{now()->format('Y/m')}",
            uniqid() . '_' . $file->getClientOriginalName(),
            'public'
        );

        DocumentVersion::create([
            'document_id' => $document->id,
            'file_path' => $path,
            'file_size' => $file->getSize(),
            'mime_type' => $mimeType,
            'version_number' => $versionNumber,
            'created_by' => auth()->id(),
            'change_log' => $validated['change_log'] ?? null,
        ]);

        $document->update([
            'file_path' => $path,
            'mime_type' => $mimeType,
            'file_size' => $file->getSize(),
        ]);

        return response()->json(['success' => true, 'version_number' => $versionNumber]);
    }

    public function restoreVersion(DocumentVersion $version)
    {
        $document = $version->document;
        Gate::authorize('update', $document);

        $oldPath = $document->file_path;

        $document->update([
            'file_path' => $version->file_path,
            'mime_type' => $version->mime_type,
            'file_size' => $version->file_size,
        ]);

        $newVersion = DocumentVersion::create([
            'document_id' => $document->id,
            'file_path' => $version->file_path,
            'file_size' => $version->file_size,
            'mime_type' => $version->mime_type,
            'version_number' => $document->versions()->max('version_number') + 1,
            'created_by' => auth()->id(),
            'change_log' => "Restored from version {$version->version_number}",
        ]);

        return response()->json(['success' => true, 'version_number' => $newVersion->version_number]);
    }

    private function getFileType(string $mimeType): string
    {
        if (str_starts_with($mimeType, 'image/')) {
            return 'image';
        }
        if (str_starts_with($mimeType, 'video/')) {
            return 'video';
        }
        if (in_array($mimeType, ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])) {
            return 'document';
        }
        if (in_array($mimeType, ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'])) {
            return 'archive';
        }
        return 'other';
    }
}
