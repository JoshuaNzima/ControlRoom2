<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Models\PublicIntake;

class PublicIntakeController extends Controller
{
    public function store(Request $request)
    {
        $baseRules = [
            'type' => 'required|in:ticket,down,incident',
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:50',
            'client_name' => 'nullable|string|max:255',
            'client_site' => 'nullable|string|max:255',
            'title' => 'nullable|string|max:255',
            'description' => 'required|string',
            'attachments.*' => 'file|max:5120',
        ];

        $typeSpecific = [];
        if ($request->input('type') === 'ticket') {
            $typeSpecific = [
                'title' => 'required|string|max:255',
                'category' => 'required|in:complaint,incident,request,maintenance,emergency',
                'priority' => 'required|in:low,medium,high,critical',
            ];
        } elseif ($request->input('type') === 'down') {
            $typeSpecific = [
                'title' => 'required|string|max:255',
                'down_type' => 'required|in:guard_absent,site_unmanned,other',
            ];
        } elseif ($request->input('type') === 'incident') {
            $typeSpecific = [
                'title' => 'required|string|max:255',
            ];
        }

        $validated = $request->validate(array_merge($baseRules, $typeSpecific));

        $attachments = [];
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $path = $file->store('public-intake', 'public');
                $attachments[] = [
                    'filename' => $file->getClientOriginalName(),
                    'path' => $path,
                    'mime_type' => $file->getClientMimeType(),
                    'size' => $file->getSize(),
                ];
            }
        }

        $payload = [
            'type' => $validated['type'],
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'client_name' => $validated['client_name'] ?? null,
            'client_site' => $validated['client_site'] ?? null,
            'title' => $validated['title'] ?? null,
            'category' => $validated['category'] ?? null,
            'priority' => $validated['priority'] ?? null,
            'description' => $validated['description'],
            'attachments' => $attachments,
            'status' => 'open',
            'ip_address' => $request->ip(),
            'user_agent' => (string) $request->userAgent(),
        ];

        if ($validated['type'] === 'down') {
            $payload['category'] = $validated['down_type'];
        }

        PublicIntake::create($payload);

        return back()->with('success', 'Thank you. Your submission has been received. Our team will review and respond shortly.');
    }
}
