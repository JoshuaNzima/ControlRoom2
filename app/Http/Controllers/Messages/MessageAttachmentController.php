<?php

namespace App\Http\Controllers\Messages;

use App\Http\Controllers\Controller;
use App\Models\Communication\Message;
use App\Models\Communication\MessageAttachment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class MessageAttachmentController extends Controller
{
    public function store(Request $request, Message $message)
    {
        // Check if user is the sender
        if ($message->sender_id !== Auth::id()) {
            abort(403);
        }

        $validated = $request->validate([
            'file' => 'required|file|max:10240', // 10MB max
        ]);

        $file = $request->file('file');
        $path = $file->store('message-attachments', 'private');

        $attachment = $message->attachments()->create([
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'file_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
        ]);

        return response()->json([
            'id' => $attachment->id,
            'file_name' => $attachment->file_name,
            'file_type' => $attachment->file_type,
            'file_size' => $attachment->file_size,
            'url' => route('messages.attachments.download', $attachment),
        ]);
    }

    public function download(MessageAttachment $attachment)
    {
        // Check if user is a participant in the conversation
        $conversation = $attachment->message->conversation;
        if (!$conversation->participants()->where('user_id', Auth::id())->exists()) {
            abort(403);
        }

        return Storage::disk('private')->download(
            $attachment->file_path,
            $attachment->file_name
        );
    }

    public function destroy(MessageAttachment $attachment)
    {
        // Only sender or conversation admin can delete
        $message = $attachment->message;
        $conversation = $message->conversation;

        $isSender = $message->sender_id === Auth::id();
        $isAdmin = $conversation->participants()
            ->where('user_id', Auth::id())
            ->wherePivot('role', 'admin')
            ->exists();

        if (!$isSender && !$isAdmin) {
            abort(403);
        }

        Storage::disk('private')->delete($attachment->file_path);
        $attachment->delete();

        return response()->json(['deleted' => true]);
    }
}
