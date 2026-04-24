<?php

return [
    'lock_minutes' => env('SCANNER_LOCK_MINUTES', 120),
    'require_gps' => env('SCANNER_REQUIRE_GPS', true),
    'site_radius_meters' => env('SCANNER_SITE_RADIUS_METERS', 10),
    'checkpoint_radius_meters' => env('SCANNER_CHECKPOINT_RADIUS_METERS', 100),
    'recent_scans_hours' => env('SCANNER_RECENT_SCANS_HOURS', 24),
    'gps_mismatch_alert_threshold' => env('SCANNER_GPS_MISMATCH_ALERT_THRESHOLD', 3),
    'gps_mismatch_alert_window_minutes' => env('SCANNER_GPS_MISMATCH_ALERT_WINDOW_MINUTES', 10),

    // GPS accuracy handling
    'gps_accuracy_buffer_enabled' => env('SCANNER_GPS_ACCURACY_BUFFER_ENABLED', true),
    'gps_accuracy_max_meters' => env('SCANNER_GPS_ACCURACY_MAX_METERS', 100), // Reject GPS if accuracy > this
    'gps_accuracy_min_multiplier' => env('SCANNER_GPS_ACCURACY_MIN_MULTIPLIER', 1.0), // Multiply accuracy by this before adding to radius

    // GPS retry settings
    'gps_retry_enabled' => env('SCANNER_GPS_RETRY_ENABLED', true),
    'gps_retry_attempts' => env('SCANNER_GPS_RETRY_ATTEMPTS', 3),
    'gps_retry_delay_ms' => env('SCANNER_GPS_RETRY_DELAY_MS', 1000),
];
