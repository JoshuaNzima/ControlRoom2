<?php

namespace App\Services\FrontOffice;

use App\Models\FrontOffice\OfficeDuty;
use App\Models\FrontOffice\PersonalDuty;
use App\Models\User;
use App\Notifications\DutyAssignedNotification;
use Illuminate\Support\Facades\Notification;

class DutyRoutingService
{
    /**
     * Route office duty information to the right recipient
     */
    public function routeOfficeDuty(OfficeDuty $duty): void
    {
        $recipient = $this->resolveOfficeRecipient($duty);
        
        if ($recipient) {
            // Send notification to recipient
            $recipient->notify(new DutyAssignedNotification($duty, 'office'));
        }

        // Update duty with resolved recipient info
        if ($recipient && empty($duty->recipient_user_id)) {
            $duty->update([
                'recipient_user_id' => $recipient->id,
                'recipient_email' => $recipient->email,
            ]);
        }
    }

    /**
     * Route personal duty information to the employer
     */
    public function routePersonalDuty(PersonalDuty $duty): void
    {
        $employer = $this->resolvePersonalEmployer($duty);

        if ($employer) {
            $employer->notify(new DutyAssignedNotification($duty, 'personal'));
        }

        // Update duty with resolved employer info
        if ($employer && empty($duty->employer_user_id)) {
            $duty->update([
                'employer_user_id' => $employer->id,
                'employer_email' => $employer->email,
            ]);
        }
    }

    /**
     * Resolve the appropriate recipient for an office duty
     */
    private function resolveOfficeRecipient(OfficeDuty $duty): ?User
    {
        // Priority 1: Explicitly assigned recipient
        if ($duty->recipient_user_id) {
            return User::find($duty->recipient_user_id);
        }

        // Priority 2: Based on duty type routing rules
        $routingRules = config('front-office.routing.office', []);
        
        if (isset($routingRules[$duty->duty_type])) {
            $roleOrUser = $routingRules[$duty->duty_type];
            
            // Check if it's a role
            if (is_string($roleOrUser) && !str_contains($roleOrUser, '@')) {
                return User::role($roleOrUser)->first();
            }
            
            // Check if it's a user ID
            if (is_numeric($roleOrUser)) {
                return User::find($roleOrUser);
            }
        }

        // Priority 3: Default executive or manager
        return User::role(['executive', 'manager', 'admin'])->first();
    }

    /**
     * Resolve the employer for a personal duty
     */
    private function resolvePersonalEmployer(PersonalDuty $duty): ?User
    {
        // Priority 1: Explicitly assigned employer
        if ($duty->employer_user_id) {
            return User::find($duty->employer_user_id);
        }

        // Priority 2: By name/email lookup
        if ($duty->employer_email) {
            return User::where('email', $duty->employer_email)->first();
        }

        // Priority 3: Default routing from config
        $defaultEmployerId = config('front-office.routing.personal.default_employer');
        if ($defaultEmployerId) {
            return User::find($defaultEmployerId);
        }

        // Priority 4: First user with manager/admin role
        return User::role(['manager', 'admin', 'super_admin'])->first();
    }

    /**
     * Get routing configuration for a duty type
     */
    public function getRoutingConfig(string $dutyType, string $category = 'office'): array
    {
        $key = "front-office.routing.{$category}.{$dutyType}";
        return [
            'default_recipient' => config($key),
            'notification_channels' => config('front-office.notifications.channels', ['mail', 'database']),
            'escalation_enabled' => config('front-office.notifications.escalation_enabled', true),
        ];
    }

    /**
     * Send escalation notification if duty is overdue
     */
    public function escalateIfOverdue($duty): bool
    {
        if ($duty->status !== 'pending' && $duty->status !== 'in_progress') {
            return false;
        }

        $isOverdue = $duty->scheduled_end && $duty->scheduled_end->isPast();
        
        if (!$isOverdue) {
            return false;
        }

        $escalationRecipient = User::role(['manager', 'admin'])->first();
        
        if ($escalationRecipient) {
            $escalationRecipient->notify(new DutyAssignedNotification($duty, $duty instanceof OfficeDuty ? 'office' : 'personal', true));
            return true;
        }

        return false;
    }
}
