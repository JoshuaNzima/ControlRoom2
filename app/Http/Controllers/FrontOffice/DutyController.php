<?php

namespace App\Http\Controllers\FrontOffice;

use App\Http\Controllers\Controller;
use App\Models\FrontOffice\OfficeDuty;
use App\Models\FrontOffice\PersonalDuty;
use App\Services\FrontOffice\DutyRoutingService;
use App\Services\FrontOffice\PettyCashService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DutyController extends Controller
{
    private DutyRoutingService $routingService;
    private PettyCashService $pettyCashService;

    public function __construct(
        DutyRoutingService $routingService,
        PettyCashService $pettyCashService
    ) {
        $this->routingService = $routingService;
        $this->pettyCashService = $pettyCashService;
    }

    /**
     * Get office duties for the authenticated user
     */
    public function getOfficeDuties(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = OfficeDuty::where('user_id', $user->id)
            ->with(['recipient', 'expense']);

        // Filter by status
        if ($request->has('status')) {
            $query->byStatus($request->status);
        }

        // Filter by duty type
        if ($request->has('duty_type')) {
            $query->byType($request->duty_type);
        }

        // Filter by date range
        if ($request->has('from_date')) {
            $query->whereDate('scheduled_start', '>=', $request->from_date);
        }
        if ($request->has('to_date')) {
            $query->whereDate('scheduled_start', '<=', $request->to_date);
        }

        $duties = $query->orderBy('scheduled_start', 'asc')
            ->paginate($request->get('per_page', 20));

        return response()->json($duties);
    }

    /**
     * Get personal duties for the authenticated user
     */
    public function getPersonalDuties(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = PersonalDuty::where('user_id', $user->id)
            ->with(['employer', 'expense']);

        if ($request->has('status')) {
            $query->byStatus($request->status);
        }

        if ($request->has('duty_type')) {
            $query->byType($request->duty_type);
        }

        if ($request->has('employer_user_id')) {
            $query->forEmployer($request->employer_user_id);
        }

        $duties = $query->orderBy('scheduled_start', 'asc')
            ->paginate($request->get('per_page', 20));

        return response()->json($duties);
    }

    /**
     * Store a new office duty
     */
    public function storeOfficeDuty(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'duty_type' => 'required|in:calendar_schedule,communication,meeting_coordination,travel_arrangements,report_document,petty_cash,confidential,event_planning,office_admin_support',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'in:low,medium,high,urgent',
            'scheduled_start' => 'nullable|date',
            'scheduled_end' => 'nullable|date|after_or_equal:scheduled_start',
            'recipient_name' => 'nullable|string|max:255',
            'recipient_email' => 'nullable|email',
            'recipient_phone' => 'nullable|string|max:50',
            'recipient_user_id' => 'nullable|exists:users,id',
            'recipient_type' => 'nullable|in:executive,manager,department,external,other',
            'petty_cash_amount' => 'nullable|numeric|min:0',
            'meeting_location' => 'nullable|string|max:255',
            'meeting_agenda' => 'nullable|string',
            'travel_destination' => 'nullable|string|max:255',
            'confidentiality_level' => 'nullable|in:normal,confidential,strictly_confidential',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $duty = OfficeDuty::create([
            'user_id' => $request->user()->id,
            ...$validator->validated(),
            'status' => 'pending',
        ]);

        // Process petty cash if amount provided
        if ($duty->petty_cash_amount > 0) {
            $this->pettyCashService->processOfficePettyCash($duty);
        }

        // Route to recipient
        $this->routingService->routeOfficeDuty($duty);

        return response()->json([
            'message' => 'Office duty created successfully',
            'duty' => $duty->load(['recipient', 'expense']),
        ], 201);
    }

    /**
     * Store a new personal duty
     */
    public function storePersonalDuty(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'duty_type' => 'required|in:diary_management,calls_messages,travel_transport,personal_errands,document_organization,household_coordination,correspondence,reminders_followups,general_admin_support',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'in:low,medium,high,urgent',
            'scheduled_start' => 'nullable|date',
            'scheduled_end' => 'nullable|date|after_or_equal:scheduled_start',
            'employer_name' => 'required|string|max:255',
            'employer_email' => 'nullable|email',
            'employer_phone' => 'nullable|string|max:50',
            'employer_user_id' => 'nullable|exists:users,id',
            'privacy_level' => 'in:normal,private,confidential',
            'budget_amount' => 'nullable|numeric|min:0',
            'actual_amount' => 'nullable|numeric|min:0',
            'vendor_name' => 'nullable|string|max:255',
            'receipt_reference' => 'nullable|string|max:255',
            'pickup_location' => 'nullable|string|max:255',
            'dropoff_location' => 'nullable|string|max:255',
            'transport_mode' => 'nullable|string|max:50',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $duty = PersonalDuty::create([
            'user_id' => $request->user()->id,
            ...$validator->validated(),
            'status' => 'pending',
        ]);

        // Process expense if actual amount provided
        if ($duty->actual_amount > 0) {
            $this->pettyCashService->processPersonalExpense($duty);
        }

        // Route to employer
        $this->routingService->routePersonalDuty($duty);

        return response()->json([
            'message' => 'Personal duty created successfully',
            'duty' => $duty->load(['employer', 'expense']),
        ], 201);
    }

    /**
     * Update an office duty
     */
    public function updateOfficeDuty(Request $request, int $id): JsonResponse
    {
        $duty = OfficeDuty::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'status' => 'in:pending,in_progress,completed,cancelled',
            'scheduled_start' => 'nullable|date',
            'scheduled_end' => 'nullable|date|after_or_equal:scheduled_start',
            'petty_cash_amount' => 'nullable|numeric|min:0',
            'expense_receipt_number' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        if ($request->has('status') && $request->status === 'completed') {
            $data['completed_at'] = now();
        }

        $duty->update($data);

        // Update expense if petty cash changed
        if (isset($data['petty_cash_amount'])) {
            $this->pettyCashService->updateExpenseFromDuty($duty);
        }

        return response()->json([
            'message' => 'Office duty updated successfully',
            'duty' => $duty->fresh(['recipient', 'expense']),
        ]);
    }

    /**
     * Update a personal duty
     */
    public function updatePersonalDuty(Request $request, int $id): JsonResponse
    {
        $duty = PersonalDuty::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'status' => 'in:pending,in_progress,completed,cancelled',
            'actual_amount' => 'nullable|numeric|min:0',
            'receipt_reference' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        if ($request->has('status') && $request->status === 'completed') {
            $data['completed_at'] = now();
        }

        $duty->update($data);

        // Process or update expense if amount provided
        if (isset($data['actual_amount']) && $data['actual_amount'] > 0) {
            if ($duty->expense_id) {
                $this->pettyCashService->updateExpenseFromDuty($duty);
            } else {
                $this->pettyCashService->processPersonalExpense($duty);
            }
        }

        return response()->json([
            'message' => 'Personal duty updated successfully',
            'duty' => $duty->fresh(['employer', 'expense']),
        ]);
    }

    /**
     * Delete an office duty
     */
    public function deleteOfficeDuty(Request $request, int $id): JsonResponse
    {
        $duty = OfficeDuty::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $duty->delete();

        return response()->json(['message' => 'Office duty deleted successfully']);
    }

    /**
     * Delete a personal duty
     */
    public function deletePersonalDuty(Request $request, int $id): JsonResponse
    {
        $duty = PersonalDuty::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $duty->delete();

        return response()->json(['message' => 'Personal duty deleted successfully']);
    }

    /**
     * Get dashboard stats
     */
    public function getStats(Request $request): JsonResponse
    {
        $user = $request->user();

        $officeStats = [
            'today' => OfficeDuty::where('user_id', $user->id)->today()->count(),
            'pending' => OfficeDuty::where('user_id', $user->id)->pending()->count(),
            'with_petty_cash' => OfficeDuty::where('user_id', $user->id)->withPettyCash()->count(),
            'total_petty_cash' => OfficeDuty::where('user_id', $user->id)->withPettyCash()->sum('petty_cash_amount'),
        ];

        $personalStats = [
            'today' => PersonalDuty::where('user_id', $user->id)->today()->count(),
            'pending' => PersonalDuty::where('user_id', $user->id)->pending()->count(),
            'with_expenses' => PersonalDuty::where('user_id', $user->id)->withExpenses()->count(),
            'total_expenses' => PersonalDuty::where('user_id', $user->id)->sum('actual_amount'),
        ];

        return response()->json([
            'office' => $officeStats,
            'personal' => $personalStats,
        ]);
    }
}
