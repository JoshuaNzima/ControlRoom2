<?php

namespace App\Listeners;

use App\Events\TaskUpdated;
use App\Services\PushNotificationService;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class SendTaskPushNotification implements ShouldQueue
{
    use InteractsWithQueue;

    protected array $actionMessages = [
        'created' => 'New task assigned',
        'updated' => 'Task updated',
        'completed' => 'Task completed',
        'reopened' => 'Task reopened',
        'deleted' => 'Task deleted',
        'due_soon' => 'Task due soon',
    ];

    public function handle(TaskUpdated $event): void
    {
        try {
            $task = $event->task;
            $action = $event->action;
            
            $users = collect();
            
            // Notify assigned user
            if ($task->assigned_to && $action !== 'deleted') {
                $assignedUser = User::find($task->assigned_to);
                if ($assignedUser) {
                    $users->push($assignedUser);
                }
            }
            
            // Notify creator about completion
            if ($action === 'completed' && $task->created_by) {
                $creator = User::find($task->created_by);
                if ($creator && $creator->id !== $task->assigned_to) {
                    $users->push($creator);
                }
            }
            
            // Notify admins about new tasks if unassigned
            if ($action === 'created' && !$task->assigned_to) {
                $admins = User::whereHas('roles', function ($query) {
                    $query->whereIn('name', ['admin', 'super_admin']);
                })->get();
                $users = $users->merge($admins);
            }

            $users = $users->unique('id')->values();
            
            if ($users->isEmpty()) {
                return;
            }

            $pushService = new PushNotificationService();
            
            $title = $this->actionMessages[$action] ?? 'Task Updated';
            $body = "\"{$task->title}\"";
            
            if ($task->due_date) {
                $body .= " - Due: " . $task->due_date->format('M j');
            }
            
            $payload = PushNotificationService::createPayload(
                $title,
                $body,
                null,
                route('tasks.index'),
                'task-' . $task->id,
                [
                    'type' => 'task',
                    'task_id' => $task->id,
                    'action' => $action,
                    'status' => $task->status,
                    'priority' => $task->priority,
                ]
            );

            $result = $pushService->sendToUsers($users, $payload);

            Log::info('Task push notification sent', [
                'task_id' => $task->id,
                'action' => $action,
                'recipients' => $users->count(),
                'result' => $result,
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to send task push notification', [
                'error' => $e->getMessage(),
                'task_id' => $event->task->id ?? null,
            ]);
        }
    }
}
