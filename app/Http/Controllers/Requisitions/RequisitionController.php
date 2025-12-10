<?php

namespace App\Http\Controllers\Requisitions;

use App\Http\Controllers\Controller;
use App\Models\Requisition;
use App\Models\RequisitionAttachment;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RequisitionController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $query = Requisition::query()->with(['requestedBy', 'approvedBy', 'disbursedBy', 'batch']);

        if ($user->hasAnyRole(['admin', 'super_admin'])) {
            // admins see everything
        } elseif ($user->hasAnyRole(['asset_manager', 'assets_manager'])) {
            // Asset managers: allow toggling via mode=disburse|mine (default: disburse)
            $mode = $request->query('mode', 'disburse');
            if ($mode === 'mine') {
                $query->where('requested_by', $user->id);
            } else {
                $query->where('status', 'pending_disbursement');
            }
        } else {
            // regular users see their own
            $query->where('requested_by', $user->id);
        }

        $requisitions = $query->orderByDesc('created_at')->paginate(20);

        return Inertia::render('Requisitions/Index', [
            'requisitions' => $requisitions,
            'mode' => $request->query('mode', $user->hasAnyRole(['asset_manager','assets_manager']) ? 'disburse' : 'mine'),
            'auth' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'roles' => $user->getRoleNames(),
                ],
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'in:general,fuel,vehicle_hire,events,k9,utilities,office_supplies'],
            'description' => ['nullable', 'string'],
            'needed_by' => ['nullable', 'date'],
            'amount' => ['required', 'numeric', 'min:0'],
            'attachments' => ['sometimes', 'array', 'max:10'],
            'attachments.*' => ['file', 'max:10240', 'mimes:pdf,jpg,jpeg,png,doc,docx,xls,xlsx'],
        ]);

        $data['requested_by'] = $user->id;
        $data['status'] = 'pending_admin';
        $data['category'] = $data['category'] ?? 'general';

        $requisition = Requisition::create($data);

        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                if (!$file) continue;
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
        }

        return redirect()->route('requisitions.index');
    }

    public function show(Requisition $requisition): Response|JsonResponse
    {
        $requisition->load(['requestedBy', 'approvedBy', 'disbursedBy', 'batch', 'attachments.uploadedBy']);

        if (request()->wantsJson() || request()->ajax()) {
            return response()->json($requisition);
        }

        return Inertia::render('Requisitions/Show', [
            'requisition' => $requisition,
        ]);
    }

    public function resubmit(Request $request, Requisition $requisition): RedirectResponse
    {
        $this->authorizeOwner($request, $requisition);

        if ($requisition->status !== 'needs_revision') {
            return back();
        }

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'needed_by' => ['nullable', 'date'],
            'amount' => ['required', 'numeric', 'min:0'],
        ]);

        $requisition->fill($data);
        $requisition->status = 'pending_admin';
        $requisition->notes_admin = null;
        $requisition->save();

        return back();
    }

    public function summary(Request $request): JsonResponse
    {
        $user = $request->user();

        $myOpen = Requisition::where('requested_by', $user->id)
            ->whereIn('status', ['pending_admin', 'needs_revision', 'pending_disbursement'])
            ->count();

        $myNeedsRevision = Requisition::where('requested_by', $user->id)
            ->where('status', 'needs_revision')
            ->count();

        $pendingAdmin = 0;
        $pendingDisbursement = 0;

        if ($user->hasAnyRole(['admin', 'super_admin'])) {
            $pendingAdmin = Requisition::where('status', 'pending_admin')->count();
        }

        if ($user->hasAnyRole(['asset_manager', 'assets_manager', 'super_admin'])) {
            $pendingDisbursement = Requisition::where('status', 'pending_disbursement')->count();
        }

        return response()->json([
            'my_open' => $myOpen,
            'my_needs_revision' => $myNeedsRevision,
            'pending_admin' => $pendingAdmin,
            'pending_disbursement' => $pendingDisbursement,
        ]);
    }

    protected function authorizeOwner(Request $request, Requisition $requisition): void
    {
        abort_unless($request->user()->id === $requisition->requested_by, 403);
    }
}
