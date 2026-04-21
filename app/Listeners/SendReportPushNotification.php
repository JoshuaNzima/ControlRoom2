<?php

namespace App\Listeners;

use App\Events\ReportGenerated;
use App\Services\PushNotificationService;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class SendReportPushNotification implements ShouldQueue
{
    use InteractsWithQueue;

    protected array $reportTypeNames = [
        'attendance' => 'Attendance Report',
        'incidents' => 'Incident Report',
        'guards' => 'Guard Report',
        'financial' => 'Financial Report',
        'operations' => 'Operations Report',
        'hr' => 'HR Report',
        'compliance' => 'Compliance Report',
        'performance' => 'Performance Report',
    ];

    public function handle(ReportGenerated $event): void
    {
        try {
            $reportType = $event->reportType;
            $generatedBy = $event->generatedBy;
            
            // Notify the user who requested the report
            $users = collect();
            
            if ($generatedBy) {
                $requester = User::find($generatedBy);
                if ($requester) {
                    $users->push($requester);
                }
            }
            
            // Also notify admins for certain report types
            if (in_array($reportType, ['financial', 'compliance', 'incidents'])) {
                $admins = User::whereHas('roles', function ($query) {
                    $query->whereIn('name', ['admin', 'super_admin']);
                })->where('id', '!=', $generatedBy)->get();
                $users = $users->merge($admins);
            }

            $users = $users->unique('id')->values();
            
            if ($users->isEmpty()) {
                return;
            }

            $pushService = new PushNotificationService();
            
            $title = $this->reportTypeNames[$reportType] ?? 'Report Ready';
            $body = "Your {$reportType} report has been generated and is ready for download.";
            
            $payload = PushNotificationService::createPayload(
                $title,
                $body,
                null,
                $event->downloadUrl ?? route('reports.index'),
                'report-' . $reportType . '-' . now()->timestamp,
                [
                    'type' => 'report',
                    'report_type' => $reportType,
                    'download_url' => $event->downloadUrl,
                    'generated_by' => $generatedBy,
                ]
            );

            $result = $pushService->sendToUsers($users, $payload);

            Log::info('Report push notification sent', [
                'report_type' => $reportType,
                'recipients' => $users->count(),
                'result' => $result,
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to send report push notification', [
                'error' => $e->getMessage(),
                'report_type' => $event->reportType ?? null,
            ]);
        }
    }
}
