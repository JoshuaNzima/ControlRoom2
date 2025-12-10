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
