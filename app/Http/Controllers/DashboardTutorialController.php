<?php

namespace App\Http\Controllers;

use App\Models\DashboardTutorial;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class DashboardTutorialController extends Controller
{
    /**
     * Get tutorials for a specific dashboard.
     */
    public function index(Request $request, string $dashboard)
    {
        $this->validateDashboard($dashboard);

        $tutorials = DashboardTutorial::forDashboard($dashboard)
            ->with('creator:id,name')
            ->get()
            ->map(function ($tutorial) {
                return [
                    'id' => $tutorial->id,
                    'title' => $tutorial->title,
                    'description' => $tutorial->description,
                    'content_type' => $tutorial->content_type,
                    'content' => $tutorial->content,
                    'file_url' => $tutorial->file_url,
                    'video_url' => $tutorial->video_url,
                    'video_type' => $tutorial->video_type,
                    'embed_url' => $tutorial->embed_url,
                    'is_uploaded_video' => $tutorial->is_uploaded_video,
                    'order' => $tutorial->order,
                    'created_by' => $tutorial->creator?->name,
                    'created_at' => $tutorial->created_at->diffForHumans(),
                ];
            });

        return response()->json([
            'success' => true,
            'tutorials' => $tutorials,
        ]);
    }

    /**
     * Store a new tutorial.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'dashboard' => ['required', 'string', Rule::in(array_keys(DashboardTutorial::DASHBOARDS))],
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'content_type' => ['required', Rule::in([DashboardTutorial::TYPE_VIDEO, DashboardTutorial::TYPE_DOCUMENT, DashboardTutorial::TYPE_TEXT])],
            'content' => 'nullable|string',
            'video_url' => 'nullable|url|max:500',
            'video_type' => ['nullable', Rule::in([DashboardTutorial::VIDEO_YOUTUBE, DashboardTutorial::VIDEO_VIMEO, DashboardTutorial::VIDEO_UPLOAD])],
            'file' => 'nullable|file|max:512000', // 500MB max for videos
            'order' => 'nullable|integer|min:0',
        ]);

        $tutorial = new DashboardTutorial();
        $tutorial->dashboard = $validated['dashboard'];
        $tutorial->title = $validated['title'];
        $tutorial->description = $validated['description'] ?? null;
        $tutorial->content_type = $validated['content_type'];
        $tutorial->content = $validated['content'] ?? null;
        $tutorial->video_url = $validated['video_url'] ?? null;
        $tutorial->video_type = $validated['video_type'] ?? DashboardTutorial::VIDEO_YOUTUBE;
        $tutorial->order = $validated['order'] ?? 0;
        $tutorial->created_by = $request->user()->id;

        // Handle file upload (document or video)
        if ($request->hasFile('file')) {
            $path = $request->file('file')->store('tutorials', 'public');
            $tutorial->file_path = $path;
            // If video type is upload, set video_type
            if ($validated['content_type'] === DashboardTutorial::TYPE_VIDEO && empty($validated['video_type'])) {
                $tutorial->video_type = DashboardTutorial::VIDEO_UPLOAD;
            }
        }

        $tutorial->save();

        return response()->json([
            'success' => true,
            'message' => 'Tutorial created successfully',
            'tutorial' => [
                'id' => $tutorial->id,
                'title' => $tutorial->title,
                'content_type' => $tutorial->content_type,
                'video_type' => $tutorial->video_type,
                'file_url' => $tutorial->file_url,
                'embed_url' => $tutorial->embed_url,
            ],
        ]);
    }

    /**
     * Get a specific tutorial.
     */
    public function show(DashboardTutorial $tutorial)
    {
        return response()->json([
            'success' => true,
            'tutorial' => [
                'id' => $tutorial->id,
                'dashboard' => $tutorial->dashboard,
                'title' => $tutorial->title,
                'description' => $tutorial->description,
                'content_type' => $tutorial->content_type,
                'content' => $tutorial->content,
                'file_url' => $tutorial->file_url,
                'video_url' => $tutorial->video_url,
                'video_type' => $tutorial->video_type,
                'embed_url' => $tutorial->embed_url,
                'is_uploaded_video' => $tutorial->is_uploaded_video,
                'order' => $tutorial->order,
                'is_active' => $tutorial->is_active,
                'created_by' => $tutorial->creator?->name,
                'created_at' => $tutorial->created_at->format('Y-m-d H:i'),
            ],
        ]);
    }

    /**
     * Update a tutorial.
     */
    public function update(Request $request, DashboardTutorial $tutorial)
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'content_type' => ['sometimes', 'required', Rule::in([DashboardTutorial::TYPE_VIDEO, DashboardTutorial::TYPE_DOCUMENT, DashboardTutorial::TYPE_TEXT])],
            'content' => 'nullable|string',
            'video_url' => 'nullable|url|max:500',
            'video_type' => ['nullable', Rule::in([DashboardTutorial::VIDEO_YOUTUBE, DashboardTutorial::VIDEO_VIMEO, DashboardTutorial::VIDEO_UPLOAD])],
            'file' => 'nullable|file|max:512000', // 500MB max
            'order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        if (isset($validated['title'])) {
            $tutorial->title = $validated['title'];
        }
        if (array_key_exists('description', $validated)) {
            $tutorial->description = $validated['description'];
        }
        if (isset($validated['content_type'])) {
            $tutorial->content_type = $validated['content_type'];
        }
        if (array_key_exists('content', $validated)) {
            $tutorial->content = $validated['content'];
        }
        if (array_key_exists('video_url', $validated)) {
            $tutorial->video_url = $validated['video_url'];
        }
        if (array_key_exists('video_type', $validated)) {
            $tutorial->video_type = $validated['video_type'];
        }
        if (array_key_exists('order', $validated)) {
            $tutorial->order = $validated['order'];
        }
        if (array_key_exists('is_active', $validated)) {
            $tutorial->is_active = $validated['is_active'];
        }

        // Handle file upload (document or video)
        if ($request->hasFile('file')) {
            // Delete old file
            if ($tutorial->file_path) {
                Storage::disk('public')->delete($tutorial->file_path);
            }
            $path = $request->file('file')->store('tutorials', 'public');
            $tutorial->file_path = $path;
            // If video type is upload, set video_type
            if (isset($validated['content_type']) && $validated['content_type'] === DashboardTutorial::TYPE_VIDEO && empty($validated['video_type'])) {
                $tutorial->video_type = DashboardTutorial::VIDEO_UPLOAD;
            }
        }

        $tutorial->save();

        return response()->json([
            'success' => true,
            'message' => 'Tutorial updated successfully',
        ]);
    }

    /**
     * Delete a tutorial.
     */
    public function destroy(DashboardTutorial $tutorial)
    {
        $tutorial->delete();

        return response()->json([
            'success' => true,
            'message' => 'Tutorial deleted successfully',
        ]);
    }

    /**
     * Validate dashboard parameter.
     */
    protected function validateDashboard(string $dashboard): void
    {
        if (!in_array($dashboard, array_keys(DashboardTutorial::DASHBOARDS))) {
            abort(404, 'Invalid dashboard');
        }
    }
}
