<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Front Office Routing Configuration
    |--------------------------------------------------------------------------
    |
    | Configure default recipients for different duty types
    |
    */
    'routing' => [
        'office' => [
            // Default recipients by duty type (can be role name or user ID)
            'calendar_schedule' => 'executive',
            'communication' => 'executive',
            'meeting_coordination' => 'executive',
            'travel_arrangements' => 'executive',
            'report_document' => 'executive',
            'petty_cash' => 'finance_officer',
            'confidential' => 'executive',
            'event_planning' => 'executive',
            'office_admin_support' => 'admin',
        ],
        'personal' => [
            'default_employer' => env('FRONT_OFFICE_DEFAULT_EMPLOYER_ID'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Notification Settings
    |--------------------------------------------------------------------------
    */
    'notifications' => [
        'channels' => ['mail', 'database'],
        'escalation_enabled' => true,
        'escalation_hours' => 24, // Hours after scheduled time before escalation
    ],

    /*
    |--------------------------------------------------------------------------
    | Petty Cash Settings
    |--------------------------------------------------------------------------
    */
    'petty_cash' => [
        'auto_create_expense' => true,
        'require_receipt_above' => 500, // MWK - require receipt above this amount
        'approval_threshold' => 5000, // MWK - requires additional approval above this amount
        'default_account_id' => env('FRONT_OFFICE_PETTY_CASH_ACCOUNT_ID'),
    ],
];
