<?php

namespace App\Models\Guards;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;
use Carbon\Carbon;

class Attendance extends Model
{
    protected $table = 'attendance';

    protected $fillable = [
        'guard_id',
        'supervisor_id',
        'client_site_id',
        'date',
        'check_in_time',
        'check_out_time',
        'hours_worked',
        'overtime_hours',
        'status',
        'check_in_notes',
        'check_out_notes',
        'check_in_photo',
        'check_out_photo',
        'backdated',
        'backdated_reason',
        'source',
    ];

    protected $casts = [
        'date' => 'date',
        'check_in_time' => 'datetime',
        'check_out_time' => 'datetime',
        'hours_worked' => 'decimal:2',
        'overtime_hours' => 'decimal:2',
        'backdated' => 'boolean',
    ];

    public function guardRelation(): BelongsTo
    {
        return $this->belongsTo(Guard::class, 'guard_id');
    }

    // legacy alias intentionally removed — use guardRelation() to avoid colliding with Eloquent internals

    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }

    public function clientSite(): BelongsTo
    {
        return $this->belongsTo(ClientSite::class);
    }

    public function getStatusColorAttribute(): string
    {
        return match($this->status) {
            'present' => 'green',
            'absent' => 'red',
            'late' => 'yellow',
            'half_day' => 'orange',
            'leave' => 'blue',
            default => 'gray',
        };
    }

    public function getStatusBadgeAttribute(): string
    {
        return ucfirst($this->status);
    }

    public function getShiftDurationAttribute(): float
    {
        if (!$this->check_in_time || !$this->check_out_time) {
            return 0;
        }

        return $this->check_out_time->diffInHours($this->check_in_time, true);
    }

    public function isLate(): bool
    {
        return $this->status === 'late';
    }

    public function isPresent(): bool
    {
        return $this->status === 'present';
    }

    public function isCheckedIn(): bool
    {
        return !is_null($this->check_in_time);
    }

    public function isCheckedOut(): bool
    {
        return !is_null($this->check_out_time);
    }

    public function calculateHours(): void
    {
        if (!$this->check_in_time || !$this->check_out_time) {
            return;
        }

        $dateString = $this->date?->toDateString() ?: (string) $this->getRawOriginal('date');
        if (!$dateString) {
            return;
        }

        $inValue = $this->check_in_time;
        $outValue = $this->check_out_time;

        $rawIn = $inValue instanceof Carbon ? $inValue->format('H:i:s') : (string) $inValue;
        $rawOut = $outValue instanceof Carbon ? $outValue->format('H:i:s') : (string) $outValue;

        if (!$rawIn || !$rawOut) {
            return;
        }

        try {
            $rawInString = trim((string) $rawIn);
            $rawOutString = trim((string) $rawOut);

            if (str_contains($rawInString, '-') || str_contains($rawInString, 'T')) {
                $checkInAt = Carbon::parse($rawInString);
            } else {
                $inParts = preg_split('/\s+/', $rawInString);
                $inTimePart = $inParts ? (string) end($inParts) : $rawInString;
                $checkInAt = Carbon::parse($dateString.' '.$inTimePart);
            }

            if (str_contains($rawOutString, '-') || str_contains($rawOutString, 'T')) {
                $checkOutAt = Carbon::parse($rawOutString);
            } else {
                $outParts = preg_split('/\s+/', $rawOutString);
                $outTimePart = $outParts ? (string) end($outParts) : $rawOutString;
                $checkOutAt = Carbon::parse($dateString.' '.$outTimePart);
            }
        } catch (\Throwable $e) {
            return;
        }

        if ($checkOutAt->lessThanOrEqualTo($checkInAt)) {
            $checkOutAt = $checkOutAt->addDay();
        }

        $totalHours = round($checkInAt->diffInMinutes($checkOutAt, true) / 60, 2);

        // Standard work day is 8 hours
        $standardHours = 8;

        if ($totalHours > $standardHours) {
            $this->hours_worked = $standardHours;
            $this->overtime_hours = max(0, $totalHours - $standardHours);
        } else {
            $this->hours_worked = $totalHours;
            $this->overtime_hours = 0;
        }

        $this->save();
    }

    public function scopeToday($query)
    {
        return $query->whereDate('date', today());
    }

    public function scopeThisWeek($query)
    {
        return $query->whereBetween('date', [
            now()->startOfWeek(),
            now()->endOfWeek()
        ]);
    }

    public function scopeThisMonth($query)
    {
        return $query->whereMonth('date', now()->month)
                    ->whereYear('date', now()->year);
    }
}