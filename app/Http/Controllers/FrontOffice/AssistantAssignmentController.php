<?php

namespace App\Http\Controllers\FrontOffice;

use App\Http\Controllers\Controller;
use App\Models\FrontOffice\AssistantAssignment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AssistantAssignmentController extends Controller
{
    /**
     * Display a listing of assistant assignments.
     */
    public function index()
    {
        $user = Auth::user();
        
        // Get all assistants (users with assistant role)
        $assistants = User::role('assistant')
            ->select('id', 'name', 'email', 'phone')
            ->withCount(['assistantAssignments as assignments_count' => function($query) {
                $query->where('status', 'active');
            }])
            ->get();
        
        // Get all users who can have assistants (executives, managers, etc.)
        $assignableUsers = User::whereHas('roles', function($query) {
            $query->whereIn('name', ['admin', 'manager', 'supervisor', 'client', 'finance_manager']);
        })
        ->orWhere('id', $user->id)
        ->select('id', 'name', 'email', 'phone')
        ->get();
        
        // Get all assignments with relationships
        $assignments = AssistantAssignment::with(['assistant', 'assignedTo'])
            ->when(!$user->hasRole(['super_admin', 'admin']), function($query) use ($user) {
                // Non-admins can only see their own assignments
                $query->where(function($q) use ($user) {
                    $q->where('assistant_id', $user->id)
                      ->orWhere('assigned_to_id', $user->id);
                });
            })
            ->orderBy('created_at', 'desc')
            ->get();
        
        return Inertia::render('FrontOffice/AssistantAssignments', [
            'assistants' => $assistants,
            'assignableUsers' => $assignableUsers,
            'assignments' => $assignments,
        ]);
    }

    /**
     * Store a newly created assignment.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'assistant_id' => 'required|exists:users,id',
            'assigned_to_id' => 'required|exists:users,id|different:assistant_id',
            'assignment_type' => 'required|in:executive,personal,both',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'notes' => 'nullable|string|max:500',
            'is_primary' => 'boolean',
        ]);
        
        // Check if assignment already exists
        $existing = AssistantAssignment::where('assistant_id', $validated['assistant_id'])
            ->where('assigned_to_id', $validated['assigned_to_id'])
            ->first();
            
        if ($existing) {
            return back()->withErrors(['assigned_to_id' => 'This assistant is already assigned to this user.']);
        }
        
        // If setting as primary, unset other primary assignments for this user
        if ($validated['is_primary'] ?? false) {
            AssistantAssignment::where('assigned_to_id', $validated['assigned_to_id'])
                ->where('is_primary', true)
                ->update(['is_primary' => false]);
        }
        
        $assignment = AssistantAssignment::create([
            ...$validated,
            'status' => 'active',
        ]);
        
        return back()->with('success', 'Assistant assigned successfully.');
    }

    /**
     * Update the specified assignment.
     */
    public function update(Request $request, AssistantAssignment $assignment)
    {
        $validated = $request->validate([
            'assignment_type' => 'sometimes|in:executive,personal,both',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'notes' => 'nullable|string|max:500',
            'is_primary' => 'boolean',
            'status' => 'sometimes|in:active,inactive,suspended',
        ]);
        
        // If setting as primary, unset other primary assignments for this user
        if (($validated['is_primary'] ?? false) && !$assignment->is_primary) {
            AssistantAssignment::where('assigned_to_id', $assignment->assigned_to_id)
                ->where('id', '!=', $assignment->id)
                ->where('is_primary', true)
                ->update(['is_primary' => false]);
        }
        
        $assignment->update($validated);
        
        return back()->with('success', 'Assignment updated successfully.');
    }

    /**
     * Remove the specified assignment.
     */
    public function destroy(AssistantAssignment $assignment)
    {
        $assignment->delete();
        
        return back()->with('success', 'Assignment removed successfully.');
    }

    /**
     * Get assignments for a specific assistant.
     */
    public function assistantAssignments(User $assistant)
    {
        $assignments = $assistant->assistantAssignments()
            ->with('assignedTo')
            ->where('status', 'active')
            ->get();
            
        return response()->json($assignments);
    }

    /**
     * Get assignments for a specific user (who has assistants).
     */
    public function userAssistants(User $user)
    {
        $assignments = $user->assignedAssistants()
            ->with('assistant')
            ->where('status', 'active')
            ->get();
            
        return response()->json($assignments);
    }
}
