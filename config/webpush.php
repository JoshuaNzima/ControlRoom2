<?php

return [
    /*
    |--------------------------------------------------------------------------
    | VAPID Configuration
    |--------------------------------------------------------------------------
    |
    | VAPID (Voluntary Application Server Identification) is used to identify
    | your server to push services. You need to generate these keys once.
    |
    | Generate keys using: php artisan webpush:vapid
    | Or online at: https://web-push-codelab.glitch.me/
    |
    */
    'vapid' => [
        'subject' => env('VAPID_SUBJECT', config('app.url')),
        'public_key' => env('VAPID_PUBLIC_KEY'),
        'private_key' => env('VAPID_PRIVATE_KEY'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Push Service Timeout
    |--------------------------------------------------------------------------
    |
    | The timeout in seconds for push service requests.
    |
    */
    'timeout' => env('WEBPUSH_TIMEOUT', 30),

    /*
    |--------------------------------------------------------------------------
    | Automatic Padding
    |--------------------------------------------------------------------------
    |
    | Automatically pad payloads to a specific length for security.
    |
    */
    'automatic_padding' => true,

    /*
    |--------------------------------------------------------------------------
    | Topic Support
    |--------------------------------------------------------------------------
    |
    | Enable topic support for grouping notifications.
    |
    */
    'topic_support' => true,
];
