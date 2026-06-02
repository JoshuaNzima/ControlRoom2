<?php

namespace App\Services;

use App\Models\Guards\GuardOffDay;
use App\Models\Guards\Guard;
use App\Models\GuardRotaException;
use App\Models\RotaTemplateDay;
use Carbon\Carbon;
use Illuminate\Support\Arr;

class RotaResolver
{
    /**
     * Returns whether a guard is off on a given date based on:
     *  1) guard_rota_exceptions
     *  2) guard's rota_template_id + rota_template_days
     *  3) legacy guard_off_days (fallback)
     */
    public function getDayStatus(int $guardId, string $date): array
    {
        $date = Carbon::parse($date)->toDateString();

        // 1) Exceptions override template.
        $exc = GuardRotaException::query()
            ->where('guard_id', $guardId)
            ->whereDate('start_date', '<=', $date)
            ->where(function ($q) use ($date) {
                $q->whereNull('end_date')
                    ->orWhereDate('end_date', '>=', $date);
            })
            ->orderByDesc('id')
            ->first();

        if ($exc) {
            $exceptionType = $exc->exception_type;

            // v1: leave/training/ad_hoc_off => off. swap => treated as off until swap-duty logic lands.
            $isOff = in_array($exceptionType, ['leave', 'training', 'ad_hoc_off', 'swap'], true);

            return [
                'is_off' => (bool) $isOff,
                'reason' => $exceptionType,
                'exception_type' => $exceptionType,
            ];
        }

        return $this->getTemplateDayStatus($guardId, $date);
    }

    /**
     * Template/legacy-only day status (ignores GuardRotaException rows).
     * This is used so the weekly planner can reconcile exceptions deterministically.
     */
    public function getTemplateDayStatus(int $guardId, string $date): array
    {
        $date = Carbon::parse($date)->toDateString();

        // 2) Template.
        $guard = Guard::query()->select(['id', 'rota_template_id'])->find($guardId);
        if (!$guard || !$guard->rota_template_id) {
            // 3) Legacy fallback.
            $off = GuardOffDay::query()
                ->where('guard_id', $guardId)
                ->whereDate('start_date', '<=', $date)
                ->where(function ($q) use ($date) {
                    $q->whereNull('end_date')->orWhereDate('end_date', '>=', $date);
                })
                ->exists();

            return [
                'is_off' => (bool) $off,
                'reason' => $off ? 'legacy_off_day' : 'work',
            ];
        }

        $weekday = (int) (Carbon::parse($date)->dayOfWeekIso % 7); // 0=Sun..6=Sat

        $templateDay = RotaTemplateDay::query()
            ->where('rota_template_id', $guard->rota_template_id)
            ->where('weekday', $weekday)
            ->first();

        $isOff = (bool) ($templateDay?->is_off ?? false);

        return [
            'is_off' => $isOff,
            'reason' => $isOff ? 'template_off' : 'work',
        ];
    }
}

