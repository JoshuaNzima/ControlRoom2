<?php

namespace App\Http\Controllers\Requisitions;

use App\Http\Controllers\Controller;
use App\Models\Requisition;
use App\Models\RequisitionAttachment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class RequisitionAttachmentController extends Controller
{
    public function store(Request $request, Requisition $requisition)
    {
        // Only owner can modify attachments and only while pending admin
        abort_unless($request->user()->id === $requisition->requested_by, 403);
        if ($requisition->status !== 'pending_admin') {
            return back();
        }

        $data = $request->validate([
            'attachments' => ['required', 'array', 'max:10'],
            'attachments.*' => ['file', 'max:10240', 'mimes:pdf,jpg,jpeg,png,doc,docx,xls,xlsx'],
        ]);

        $user = $request->user();

        foreach ($request->file('attachments', []) as $file) {
            if (!$file) {
                continue;
            }
            $disk = 'local';
            $path = $file->store('requisitions/'.date('Y/m'), $disk);
            RequisitionAttachment::create([
                'requisition_id' => $requisition->id,
                'uploaded_by' => $user->id,
                'disk' => $disk,
                'path' => $path,
                'original_name' => $file->getClientOriginalName(),
                'size' => $file->getSize() ?? 0,
                'mime_type' => $file->getClientMimeType(),
            ]);
        }

        return back();
    }

    public function destroy(Request $request, Requisition $requisition, RequisitionAttachment $attachment)
    {
        // Only owner can modify attachments and only while pending admin
        abort_unless($request->user()->id === $requisition->requested_by, 403);
        if ($requisition->status !== 'pending_admin') {
            return back();
        }

        // Ensure attachment belongs to the requisition
        abort_unless($attachment->requisition_id === $requisition->id, 404);

        if ($attachment->disk && $attachment->path) {
            Storage::disk($attachment->disk)->delete($attachment->path);
        }
        $attachment->delete();

        return back();
    }

    public function download(Request $request, Requisition $requisition, RequisitionAttachment $attachment): StreamedResponse
    {
        // Basic authorization: owner, admins, or assets managers can download
        $user = $request->user();
        $allowed = $user->id === $requisition->requested_by
            || $user->hasAnyRole(['admin', 'super_admin', 'asset_manager', 'assets_manager']);
        abort_unless($allowed, 403);

        // Ensure attachment belongs to the requisition
        abort_unless($attachment->requisition_id === $requisition->id, 404);

        return Storage::disk($attachment->disk)->download(
            $attachment->path,
            $attachment->original_name,
            $attachment->mime_type ? ['Content-Type' => $attachment->mime_type] : []
        );
    }
}
