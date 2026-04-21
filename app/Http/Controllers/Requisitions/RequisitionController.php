<?php

namespace App\Http\Controllers\Requisitions;

use App\Http\Controllers\Controller;
use App\Models\Requisition;
use App\Models\RequisitionAttachment;
use App\Models\RequisitionItem;
use App\Models\User;
use App\Notifications\GenericDbNotification;
use App\Events\RequisitionUpdated;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
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

        // First: mark overdue requisitions as expired immediately
        $this->expireOverdueRequisitions();

        $query = Requisition::query()->with(['requestedBy', 'approvedBy', 'disbursedBy', 'batch']);
        $filter = $request->query('filter', 'all');
        $pendingStatuses = ['pending_admin', 'needs_revision', 'pending_disbursement', 'pending_funding'];

        // By default, exclude archived requisitions unless specifically requested
        if ($filter !== 'archived') {
            $query->whereNull('archived_at');
        } else {
            $query->whereNotNull('archived_at');
        }

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

        // Optional filtering for list views
        if ($filter === 'expired') {
            $query->where('status', 'expired');
        } elseif ($filter === 'pending') {
            $query->whereIn('status', $pendingStatuses);
        } elseif ($filter === 'approved') {
            $query->whereIn('status', ['pending_disbursement', 'pending_funding', 'disbursed']);
        } elseif ($filter === 'rejected') {
            $query->where('status', 'needs_revision');
        } elseif ($filter === 'archived') {
            // Already filtered above, no additional status filter
        }

        $requisitions = $query->orderByDesc('created_at')->paginate(20)->withQueryString();

        // Load items for requisitions
        $requisitions->getCollection()->transform(function ($req) {
            $req->load(['items', 'requestedBy', 'approvedBy', 'disbursedBy', 'batch']);
            return $req;
        });

        return Inertia::render('Requisitions/Index', [
            'requisitions' => $requisitions,
            'mode' => $request->query('mode', $user->hasAnyRole(['asset_manager','assets_manager']) ? 'disburse' : 'mine'),
            'filter' => $filter,
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

        try {
            \Log::info('Requisition store started', ['user_id' => $user->id, 'request_data' => $request->except(['attachments'])]);

            $data = $request->validate([
                'title' => ['required', 'string', 'max:255'],
                'category' => ['nullable', 'string', 'in:general,fuel,vehicle_hire,events,k9,utilities,office_supplies,stationery,cleaning_supplies,security_equipment,uniforms,training_materials,vehicle_maintenance,communications,it_equipment,medical_supplies'],
                'description' => ['nullable', 'string'],
                'needed_by' => ['nullable', 'date'],
                'amount' => ['nullable', 'numeric', 'min:0'],
                'items' => ['required', 'array', 'min:1'],
                'items.*.description' => ['required', 'string', 'max:255'],
                'items.*.category' => ['nullable', 'string', 'in:general,fuel,vehicle_hire,events,k9,utilities,office_supplies,stationery,cleaning_supplies,security_equipment,uniforms,training_materials,vehicle_maintenance,communications,it_equipment,medical_supplies'],
                'items.*.quantity' => ['required', 'numeric', 'min:0.01'],
                'items.*.unit_price' => ['nullable', 'numeric', 'min:0'],
                'items.*.amount' => ['required', 'numeric', 'min:0'],
                'attachments' => ['sometimes', 'array', 'max:10'],
                'attachments.*' => ['file', 'max:10240', 'mimes:pdf,jpg,jpeg,png,doc,docx,xls,xlsx'],
            ]);

            \Log::info('Requisition validation passed', ['data' => $data]);

            $data['requested_by'] = $user->id;
            $data['status'] = 'pending_admin';
            $data['category'] = $data['category'] ?? 'general';

            // Calculate total from items if amount not provided
            if (empty($data['amount'])) {
                $data['amount'] = collect($data['items'])->sum('amount');
            }

            $requisition = DB::transaction(function () use ($data, $user, $request) {
                \Log::info('Creating requisition', $data);
                $requisition = Requisition::create($data);
                \Log::info('Requisition created', ['id' => $requisition->id]);

                // Create items
                foreach ($data['items'] as $itemData) {
                    $requisition->items()->create([
                        'description' => $itemData['description'],
                        'category' => $itemData['category'] ?? $requisition->category ?? 'general',
                        'quantity' => $itemData['quantity'] ?? 1,
                        'unit_price' => $itemData['unit_price'] ?? null,
                        'amount' => $itemData['amount'],
                        'status' => 'pending',
                    ]);
                }
                \Log::info('Requisition items created');

                // Handle attachments
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
                    \Log::info('Requisition attachments processed');
                }

                return $requisition;
            });

            \Log::info('Requisition transaction completed', ['requisition_id' => $requisition->id]);

            // Dispatch event for push notification
            RequisitionUpdated::dispatch($requisition, 'created');

            // Send push notification to admins
            try {
                $admins = User::role(['admin', 'super_admin'])->get();
                if ($admins->isNotEmpty()) {
                    Notification::send($admins, new GenericDbNotification([
                        'title' => 'New Requisition Submitted',
                        'message' => sprintf('%s submitted "%s" (%s)', $user->name, $requisition->title, $requisition->amount ? 'MWK ' . number_format($requisition->amount, 2) : 'No amount'),
                        'url' => route('requisitions.show', $requisition->id),
                    ]));
                }
            } catch (\Throwable $e) {
                \Log::warning('Failed to send requisition notification', ['error' => $e->getMessage()]);
            }

            return redirect()->route('requisitions.index')->with('success', 'Requisition created successfully.');
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Requisition validation failed', ['errors' => $e->errors()]);
            return back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            \Log::error('Requisition store failed', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return back()->with('error', 'Failed to create requisition: ' . $e->getMessage())->withInput();
        }
    }

    public function show(Requisition $requisition): Response|JsonResponse
    {
        // Check and mark as expired if needed
        if (in_array($requisition->status, ['pending_admin', 'pending_disbursement', 'pending_funding'])) {
            $cutoffDate = now()->subDays(5)->toDateString();
            if ($requisition->needed_by && $requisition->needed_by->toDateString() <= $cutoffDate) {
                $requisition->status = 'expired';
                $requisition->save();
            }
        }

        $requisition->load(['requestedBy', 'approvedBy', 'disbursedBy', 'batch', 'attachments.uploadedBy', 'items.approvedBy', 'items.disbursedBy']);

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

    public function update(Request $request, Requisition $requisition): RedirectResponse
    {
        $this->authorizeOwner($request, $requisition);

        if ($requisition->status !== 'pending_admin') {
            return back();
        }

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'in:general,fuel,vehicle_hire,events,k9,utilities,office_supplies,stationery,cleaning_supplies,security_equipment,uniforms,training_materials,vehicle_maintenance,communications,it_equipment,medical_supplies'],
            'description' => ['nullable', 'string'],
            'needed_by' => ['nullable', 'date'],
            'amount' => ['required', 'numeric', 'min:0'],
        ]);

        $data['category'] = $data['category'] ?? $requisition->category ?? 'general';

        $requisition->fill($data);
        $requisition->save();

        return back();
    }

    public function destroy(Request $request, Requisition $requisition): RedirectResponse
    {
        $this->authorizeOwner($request, $requisition);

        if ($requisition->status !== 'pending_admin') {
            return back();
        }

        $requisition->load('attachments');
        foreach ($requisition->attachments as $attachment) {
            if ($attachment->disk && $attachment->path) {
                Storage::disk($attachment->disk)->delete($attachment->path);
            }
        }
        $requisition->attachments()->delete();

        $requisition->delete();

        return redirect()->route('requisitions.index');
    }

    public function summary(Request $request): JsonResponse
    {
        $user = $request->user();

        $myOpen = Requisition::where('requested_by', $user->id)
            ->whereIn('status', ['pending_admin', 'needs_revision', 'pending_disbursement', 'pending_funding'])
            ->count();

        $myNeedsRevision = Requisition::where('requested_by', $user->id)
            ->where('status', 'needs_revision')
            ->count();

        $myExpired = Requisition::where('requested_by', $user->id)
            ->where('status', 'expired')
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
            'my_expired' => $myExpired,
            'pending_admin' => $pendingAdmin,
            'pending_disbursement' => $pendingDisbursement,
        ]);
    }

    protected function authorizeOwner(Request $request, Requisition $requisition): void
    {
        abort_unless($request->user()->id === $requisition->requested_by, 403);
    }

    /**
     * Mark requisitions as expired if their needed_by date has passed.
     * Uses a 5-day grace period before marking as expired.
     */
    protected function expireOverdueRequisitions(): void
    {
        $cutoffDate = now()->subDays(5)->toDateString();

        Requisition::query()
            ->whereIn('status', ['pending_admin', 'pending_disbursement', 'pending_funding'])
            ->whereNotNull('needed_by')
            ->whereDate('needed_by', '<=', $cutoffDate)
            ->update(['status' => 'expired']);
    }
}
