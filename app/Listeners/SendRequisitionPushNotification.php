<?php

namespace App\Listeners;

use App\Events\RequisitionUpdated;
use App\Services\PushNotificationService;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class SendRequisitionPushNotification implements ShouldQueue
{
    use InteractsWithQueue;

    protected array $actionMessages = [
        'created' => 'New requisition submitted',
        'approved' => 'Requisition approved',
        'rejected' => 'Requisition requires revision',
        'disbursed' => 'Requisition disbursed',
        'expired' => 'Requisition expired',
        'archived' => 'Requisition archived',
    ];

    public function handle(RequisitionUpdated $event): void
    {
        try {
            $requisition = $event->requisition;
            $action = $event->action;
            
            // Determine who should be notified
            $users = collect();
            
            // Notify requester about status changes
            if (in_array($action, ['approved', 'rejected', 'disbursed', 'expired'])) {
                $requester = User::find($requisition->requested_by);
                if ($requester) {
                    $users->push($requester);
                }
            }
            
            // Notify admins and asset managers about new requisitions
            if ($action === 'created') {
                $admins = User::whereHas('roles', function ($query) {
                    $query->whereIn('name', ['admin', 'super_admin', 'asset_manager', 'assets_manager']);
                })->get();
                $users = $users->merge($admins);
            }
            
            // Notify asset managers when ready for disbursement
            if ($action === 'approved' || $requisition->status === 'pending_disbursement') {
                $assetManagers = User::whereHas('roles', function ($query) {
                    $query->whereIn('name', ['asset_manager', 'assets_manager', 'admin', 'super_admin']);
                })->get();
                $users = $users->merge($assetManagers);
            }

            $users = $users->unique('id')->values();
            
            if ($users->isEmpty()) {
                return;
            }

            $pushService = new PushNotificationService();
            
            $title = $this->actionMessages[$action] ?? 'Requisition Updated';
            $body = "\"{$requisition->title}\" - Status: " . ucfirst(str_replace('_', ' ', $requisition->status));
            
            $payload = PushNotificationService::createPayload(
                $title,
                $body,
                null,
                route('requisitions.index'),
                'requisition-' . $requisition->id,
                [
                    'type' => 'requisition',
                    'requisition_id' => $requisition->id,
                    'action' => $action,
                    'status' => $requisition->status,
                ]
            );

            $result = $pushService->sendToUsers($users, $payload);

            Log::info('Requisition push notification sent', [
                'requisition_id' => $requisition->id,
                'action' => $action,
                'recipients' => $users->count(),
                'result' => $result,
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to send requisition push notification', [
                'error' => $e->getMessage(),
                'requisition_id' => $event->requisition->id ?? null,
            ]);
        }
    }
}
