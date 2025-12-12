<?php

return [
    'backdate' => [
        'enabled' => env('ATTENDANCE_BACKDATE_ENABLED', true),
        'max_days' => env('ATTENDANCE_BACKDATE_MAX_DAYS', 1),
        'cutoff' => env('ATTENDANCE_BACKDATE_CUTOFF', '06:00'),
    ],
    'alerts' => [
        'overdue_checkout_hours' => env('ATTENDANCE_OVERDUE_CHECKOUT_HOURS', 12),
    ],
];
