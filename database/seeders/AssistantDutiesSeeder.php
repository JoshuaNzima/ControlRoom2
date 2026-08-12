<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class AssistantDutiesSeeder extends Seeder
{
    /**
     * Executive Assistant Key Duties and Responsibilities
     */
    public const EXECUTIVE_ASSISTANT_DUTIES = [
        [
            'duty_type' => 'calendar_schedule',
            'title' => 'Calendar and Schedule Management',
            'description' => 'Organizing and maintaining the executive\'s meetings, appointments, and events. Includes scheduling, rescheduling, and ensuring no conflicts arise.',
            'priority' => 'high',
        ],
        [
            'duty_type' => 'communication',
            'title' => 'Communication Management',
            'description' => 'Screening phone calls, emails, and correspondence on behalf of the executive. Filtering important matters and drafting responses.',
            'priority' => 'high',
        ],
        [
            'duty_type' => 'meeting_coordination',
            'title' => 'Meeting Coordination',
            'description' => 'Preparing meeting agendas, taking minutes, and following up on action points. Ensuring all participants are informed and prepared.',
            'priority' => 'high',
        ],
        [
            'duty_type' => 'travel_arrangements',
            'title' => 'Travel Arrangements',
            'description' => 'Booking flights, accommodation, and preparing travel itineraries. Includes coordinating ground transport and travel documents.',
            'priority' => 'medium',
        ],
        [
            'duty_type' => 'report_document',
            'title' => 'Report and Document Preparation',
            'description' => 'Preparing reports, presentations, and official documents. Ensuring accuracy, formatting consistency, and timely delivery.',
            'priority' => 'medium',
        ],
        [
            'duty_type' => 'petty_cash',
            'title' => 'Managing Petty Cash',
            'description' => 'Overseeing petty cash funds, recording expenditures, reconciling balances, and processing reimbursement requests.',
            'priority' => 'medium',
        ],
        [
            'duty_type' => 'confidential',
            'title' => 'Confidential Information Handling',
            'description' => 'Managing sensitive information with high levels of confidentiality. Includes secure document storage and controlled access.',
            'priority' => 'urgent',
        ],
        [
            'duty_type' => 'office_admin_support',
            'title' => 'Office and Administrative Support',
            'description' => 'Acting as a link between the executive and staff. Coordinating internal communications and facilitating workflow.',
            'priority' => 'medium',
        ],
        [
            'duty_type' => 'event_planning',
            'title' => 'Event Planning',
            'description' => 'Organizing executive meetings, board meetings, corporate events, and functions. Managing logistics, invitations, and catering.',
            'priority' => 'medium',
        ],
    ];

    /**
     * Personal Assistant Key Duties and Responsibilities
     */
    public const PERSONAL_ASSISTANT_DUTIES = [
        [
            'duty_type' => 'diary_management',
            'title' => 'Diary Management',
            'description' => 'Managing the employer\'s daily schedule and appointments. Coordinating personal and professional commitments.',
            'priority' => 'high',
        ],
        [
            'duty_type' => 'calls_messages',
            'title' => 'Handling Calls and Messages',
            'description' => 'Receiving calls, taking messages, and responding when necessary. Screening communications and prioritizing urgent matters.',
            'priority' => 'high',
        ],
        [
            'duty_type' => 'travel_transport',
            'title' => 'Travel and Transport Arrangements',
            'description' => 'Organizing travel plans, bookings, and transportation. Coordinating drivers, vehicles, and logistics.',
            'priority' => 'medium',
        ],
        [
            'duty_type' => 'personal_errands',
            'title' => 'Personal Errands',
            'description' => 'Running errands such as shopping, paying bills, or arranging services. Ensuring timely completion of personal tasks.',
            'priority' => 'low',
        ],
        [
            'duty_type' => 'document_organization',
            'title' => 'Document Organization',
            'description' => 'Filing, organizing, and maintaining important documents. Ensuring secure storage and easy retrieval.',
            'priority' => 'medium',
        ],
        [
            'duty_type' => 'document_organization',
            'title' => 'Meeting and Appointment Preparation',
            'description' => 'Scheduling and preparing materials for meetings. Coordinating with attendees and arranging venues.',
            'priority' => 'medium',
        ],
        [
            'duty_type' => 'household_coordination',
            'title' => 'Household or Personal Task Coordination',
            'description' => 'Managing personal commitments such as family events or home services. Coordinating with household staff when applicable.',
            'priority' => 'medium',
        ],
        [
            'duty_type' => 'correspondence',
            'title' => 'Correspondence Management',
            'description' => 'Writing and responding to emails, letters, and other communication. Maintaining professional tone and accuracy.',
            'priority' => 'medium',
        ],
        [
            'duty_type' => 'reminders_followups',
            'title' => 'Reminders and Follow-ups',
            'description' => 'Reminding the employer about important deadlines or commitments. Tracking pending items and ensuring completion.',
            'priority' => 'high',
        ],
        [
            'duty_type' => 'general_admin_support',
            'title' => 'General Administrative Support',
            'description' => 'Performing clerical tasks and maintaining records. Supporting day-to-day operations as needed.',
            'priority' => 'low',
        ],
    ];

    public function run(): void
    {
        $this->command->info('Assistant duties reference data seeded successfully!');
        $this->command->info('Executive Assistant: ' . count(self::EXECUTIVE_ASSISTANT_DUTIES) . ' duty types defined');
        $this->command->info('Personal Assistant: ' . count(self::PERSONAL_ASSISTANT_DUTIES) . ' duty types defined');
    }
}
