<?php

namespace App\Listeners;

use App\Events\AttendanceUpdated;
use App\Services\PushNotificationService;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class SendAttendancePushNotification implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(AttendanceUpdated $event): void
    {
        try {
            $data = $event->data;
            $action = $data['action'] ?? 'check_in';
            $status = $data['status'] ?? 'present';
            
            // Only send push notifications for specific scenarios
            $shouldNotify = false;
            $title = '';
            $body = '';
            
            // Late check-in notification
            if ($status === 'late') {
                $shouldNotify = true;
                $title = 'Late Check-In Alert';
                $body = "{$data['guard_name']} checked in late at {$data['site_name']}";
            }
            
            // Absent notification
            if ($status === 'absent') {
                $shouldNotify = true;
                $title = 'Absence Alert';
                $body = "{$data['guard_name']} is marked absent at {$data['site_name']}";
            }
            
            // Check-out notification for supervisors
            if ($action === 'check_out' && $status !== 'absent') {
                $shouldNotify = true;
                $title = 'Check-Out Recorded';
                $body = "{$data['guard_name']} checked out from {$data['site_name']}";
            }
            
            if (!$shouldNotify) {
                return;
            }
            
            // Get supervisors and admins who should be notified
            $supervisorId = $data['supervisor_id'] ?? null;
            
            $users = User::whereHas('roles', function ($query) {
                $query->whereIn('name', ['admin', 'super_admin', 'zone_commander', 'supervisor']);
            })
            ->when($supervisorId, function ($query, $supervisorId) {
                $query->where('id', '!=', $supervisorId);
            })
            ->get();
            
            if ($users->isEmpty()) {
                return;
            }
            
            $pushService = new PushNotificationService();
            
            $payload = PushNotificationService::createPayload(
                $title,
                $body,
                null,
                route('attendance.index'),
                'attendance-' . $event->attendanceId,
                [
                    'type' => 'attendance',
                    'attendance_id' => $event->attendanceId,
                    'guard_name' => $data['guard_name'] ?? null,
                    'site_name' => $data['site_name'] ?? null,
                    'action' => $action,
                    'status' => $status,
                ]
            );
            
            $result = $pushService->sendToUsers($users, $payload);
            
            Log::info('Attendance push notification sent', [
                'attendance_id' => $event->attendanceId,
                'recipients' => $users->count(),
                'result' => $result,
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to send attendance push notification', [
                'error' => $e->getMessage(),
                'attendance_id' => $event->attendanceId ?? null,
            ]);
        }
    }
}
