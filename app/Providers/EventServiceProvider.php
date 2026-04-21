<?php

namespace App\Providers;

use App\Events\GPSMismatchAlert;
use App\Events\EmergencyAlert;
use App\Events\AttendanceUpdated;
use App\Events\QRScanned;
use App\Events\RequisitionUpdated;
use App\Events\GuardDismissed;
use App\Events\TaskUpdated;
use App\Events\CalendarEventCreated;
use App\Events\ReportGenerated;
use App\Events\MessageSent;
use App\Listeners\GPSMismatchNotificationListener;
use App\Listeners\SendEmergencyPushNotification;
use App\Listeners\SendAttendancePushNotification;
use App\Listeners\SendQRScanPushNotification;
use App\Listeners\SendRequisitionPushNotification;
use App\Listeners\SendGuardDismissalPushNotification;
use App\Listeners\SendTaskPushNotification;
use App\Listeners\SendCalendarEventPushNotification;
use App\Listeners\SendReportPushNotification;
use App\Listeners\SendMessagePushNotification;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event to listener mappings for the application.
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        GPSMismatchAlert::class => [
            GPSMismatchNotificationListener::class,
        ],
        EmergencyAlert::class => [
            SendEmergencyPushNotification::class,
        ],
        AttendanceUpdated::class => [
            SendAttendancePushNotification::class,
        ],
        QRScanned::class => [
            SendQRScanPushNotification::class,
        ],
        RequisitionUpdated::class => [
            SendRequisitionPushNotification::class,
        ],
        GuardDismissed::class => [
            SendGuardDismissalPushNotification::class,
        ],
        TaskUpdated::class => [
            SendTaskPushNotification::class,
        ],
        CalendarEventCreated::class => [
            SendCalendarEventPushNotification::class,
        ],
        ReportGenerated::class => [
            SendReportPushNotification::class,
        ],
        MessageSent::class => [
            SendMessagePushNotification::class,
        ],
    ];

    /**
     * Register any events for your application.
     */
    public function boot(): void
    {
        //
    }

    /**
     * Determine if events and listeners should be automatically discovered.
     */
    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
