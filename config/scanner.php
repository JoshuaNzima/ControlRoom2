<?php

return [
    'lock_minutes' => env('SCANNER_LOCK_MINUTES', 120),
    'require_gps' => env('SCANNER_REQUIRE_GPS', true),
    'site_radius_meters' => env('SCANNER_SITE_RADIUS_METERS', 10),
    'checkpoint_radius_meters' => env('SCANNER_CHECKPOINT_RADIUS_METERS', 75),
    'recent_scans_hours' => env('SCANNER_RECENT_SCANS_HOURS', 24),
    'gps_mismatch_alert_threshold' => env('SCANNER_GPS_MISMATCH_ALERT_THRESHOLD', 3),
    'gps_mismatch_alert_window_minutes' => env('SCANNER_GPS_MISMATCH_ALERT_WINDOW_MINUTES', 10),
];
