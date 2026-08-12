<?php

namespace App\Http\Controllers\FrontOffice;

use App\Http\Controllers\Controller;
use App\Models\FrontOfficeTask;
use App\Models\TaskTemplate;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TaskController extends Controller
{
    public function index(Request $request)
    {
        $query = FrontOfficeTask::query()
            ->with(['assignee:id,name', 'createdBy:id,name']);

        // Apply filters
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        if ($request->has('priority')) {
            $query->where('priority', $request->priority);
        }
        if ($request->has('assigned_to')) {
            $query->where('assigned_to', $request->assigned_to);
        }

        $tasks = $query->orderBy('due_date', 'asc')
            ->paginate(20)
            ->withQueryString();

        // Get users excluding clients, sergeants, supervisors, and guards
        $users = User::select('id', 'name')
            ->whereHas('roles', function ($q) {
                $q->whereIn('name', ['executive_assistant', 'receptionist', 'personal_assistant', 'admin', 'super_admin']);
            })
            ->orWhereDoesntHave('roles')
            ->whereDoesntHave('roles', function ($q) {
                $q->whereIn('name', ['client', 'sergeant', 'supervisor', 'guard']);
            })
            ->get();

        // Mark overdue tasks
        FrontOfficeTask::where('status', '!=', 'completed')
            ->where('due_date', '<', today())
            ->update(['status' => 'overdue']);

        $templates = TaskTemplate::select('id', 'name', 'description')
            ->withCount('items')
            ->get();

        return Inertia::render('FrontOffice/Tasks/Index', [
            'tasks' => $tasks,
            'users' => $users,
            'templates' => $templates,
            'filters' => $request->only(['status', 'priority', 'assigned_to']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'required|in:low,medium,high,urgent',
            'category' => 'required|in:general,front_office,executive,personal,ict,administration,marketing,operations,accounts',
            'due_date' => 'nullable|date',
            'assigned_to' => 'nullable|exists:users,id',
            'time_estimate' => 'nullable|numeric|min:0',
        ]);

        // Validate assignee is not a client, sergeant, supervisor, or guard
        if (!empty($validated['assigned_to'])) {
            $assignee = User::with('roles')->find($validated['assigned_to']);
            $forbiddenRoles = ['client', 'sergeant', 'supervisor', 'guard'];
            $hasForbiddenRole = $assignee && $assignee->roles->pluck('name')->intersect($forbiddenRoles)->isNotEmpty();
            if ($hasForbiddenRole) {
                return back()->withErrors(['assigned_to' => 'Cannot assign tasks to clients, sergeants, supervisors, or guards.']);
            }
        }

        $validated['created_by'] = Auth::id();
        $validated['status'] = 'pending';

        // If personal category and no assignee, assign to creator
        if ($validated['category'] === 'personal' && empty($validated['assigned_to'])) {
            $validated['assigned_to'] = Auth::id();
        }

        $task = FrontOfficeTask::create($validated);

        return redirect()->route('front-office.tasks.index')
            ->with('success', 'Task created successfully');
    }

    public function complete(Request $request, FrontOfficeTask $task)
    {
        $task->update([
            'status' => 'completed',
            'completed_at' => now(),
            'completed_by' => Auth::id(),
        ]);

        return back()->with('success', 'Task marked as completed');
    }

    public function destroy(Request $request, FrontOfficeTask $task)
    {
        $task->delete();

        return back()->with('success', 'Task deleted');
    }

    public function bulkUpdate(Request $request)
    {
        $validated = $request->validate([
            'task_ids' => 'required|array',
            'task_ids.*' => 'exists:front_office_tasks,id',
            'status' => 'required|in:pending,in_progress,completed,cancelled',
        ]);

        if ($validated['status'] === 'completed') {
            FrontOfficeTask::whereIn('id', $validated['task_ids'])
                ->update([
                    'status' => 'completed',
                    'completed_at' => now(),
                    'completed_by' => Auth::id(),
                ]);
        } else {
            FrontOfficeTask::whereIn('id', $validated['task_ids'])
                ->update([
                    'status' => $validated['status'],
                    'completed_at' => null,
                    'completed_by' => null,
                ]);
        }

        return back()->with('success', 'Tasks updated successfully');
    }

    public function storeComment(Request $request, FrontOfficeTask $task)
    {
        $validated = $request->validate([
            'comment' => 'required|string',
        ]);

        // Store comment in a simple JSON or separate table
        // For now, use the task_comments table structure
        $task->comments()->create([
            'user_id' => Auth::id(),
            'comment' => $validated['comment'],
        ]);

        return back()->with('success', 'Comment added');
    }

    public function storeTimeEntry(Request $request, FrontOfficeTask $task)
    {
        $validated = $request->validate([
            'hours' => 'required|numeric|min:0.25|max:24',
            'notes' => 'nullable|string',
        ]);

        // Store time entry
        $task->timeEntries()->create([
            'user_id' => Auth::id(),
            'hours' => $validated['hours'],
            'notes' => $validated['notes'],
        ]);

        return back()->with('success', 'Time logged');
    }

    public function export(Request $request)
    {
        $user = Auth::user();
        $role = $this->getFrontOfficeRole($user);

        if (!in_array($role, ['executive_assistant', 'admin', 'super_admin'])) {
            abort(403, 'Unauthorized');
        }

        $format = $request->input('format', 'excel');

        $query = FrontOfficeTask::query()
            ->with(['assignee:id,name', 'createdBy:id,name', 'completedBy:id,name']);

        // Apply filters
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        if ($request->has('priority')) {
            $query->where('priority', $request->priority);
        }
        if ($request->has('assigned_to')) {
            $query->where('assigned_to', $request->assigned_to);
        }
        if ($request->has('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }
        if ($request->has('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        $tasks = $query->orderBy('created_at', 'desc')->get();

        if ($format === 'pdf') {
            return $this->exportPdf($tasks);
        }

        return $this->exportExcel($tasks);
    }

    private function exportExcel($tasks)
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // Headers
        $headers = ['ID', 'Title', 'Description', 'Category', 'Status', 'Priority', 'Due Date', 'Assigned To', 'Created By', 'Completed By', 'Completed At', 'Time Estimate (hrs)', 'Created At'];
        $sheet->fromArray($headers, null, 'A1');

        // Style header
        $sheet->getStyle('A1:M1')->getFont()->setBold(true);
        $sheet->getStyle('A1:M1')->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)->getStartColor()->setRGB('C62828');
        $sheet->getStyle('A1:M1')->getFont()->getColor()->setRGB('FFFFFF');

        // Data
        $row = 2;
        foreach ($tasks as $task) {
            $sheet->setCellValue('A' . $row, $task->id);
            $sheet->setCellValue('B' . $row, $task->title);
            $sheet->setCellValue('C' . $row, $task->description);
            $sheet->setCellValue('D' . $row, $task->category);
            $sheet->setCellValue('E' . $row, $task->status);
            $sheet->setCellValue('F' . $row, $task->priority);
            $sheet->setCellValue('G' . $row, $task->due_date ? $task->due_date->format('Y-m-d') : '');
            $sheet->setCellValue('H' . $row, $task->assignee?->name ?? 'Unassigned');
            $sheet->setCellValue('I' . $row, $task->createdBy?->name ?? '');
            $sheet->setCellValue('J' . $row, $task->completedBy?->name ?? '');
            $sheet->setCellValue('K' . $row, $task->completed_at ? $task->completed_at->format('Y-m-d H:i') : '');
            $sheet->setCellValue('L' . $row, $task->time_estimate ?? '');
            $sheet->setCellValue('M' . $row, $task->created_at->format('Y-m-d H:i'));
            $row++;
        }

        // Auto width
        foreach (range('A', 'M') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $filename = 'tasks_' . now()->format('Y-m-d_His') . '.xlsx';

        $writer = new Xlsx($spreadsheet);

        $response = new StreamedResponse(function() use ($writer) {
            $writer->save('php://output');
        });

        $response->headers->set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        $response->headers->set('Content-Disposition', 'attachment; filename="' . $filename . '"');
        $response->headers->set('Cache-Control', 'max-age=0');

        return $response;
    }

    private function exportPdf($tasks)
    {
        $pdf = PDF::loadView('pdf.tasks', [
            'tasks' => $tasks,
            'generatedAt' => now()->format('Y-m-d H:i:s'),
        ]);

        $filename = 'tasks_' . now()->format('Y-m-d_His') . '.pdf';

        return $pdf->download($filename);
    }

    private function getFrontOfficeRole($user): string
    {
        $roles = $user->roles->pluck('name')->toArray();

        if (in_array('executive_assistant', $roles)) {
            return 'executive_assistant';
        }
        if (in_array('receptionist', $roles)) {
            return 'receptionist';
        }
        if (in_array('personal_assistant', $roles)) {
            return 'personal_assistant';
        }
        if (in_array('super_admin', $roles)) {
            return 'super_admin';
        }
        if (in_array('admin', $roles)) {
            return 'admin';
        }

        return 'receptionist';
    }
}

