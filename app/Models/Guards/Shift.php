<?php

namespace App\Models\Guards;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class Shift extends Model
{
    use SoftDeletes;

    /**
     * Boot events — centralized shift overlap validation.
     */
    protected static function boot()
    {
        parent::boot();

        static::saving(function (self $shift) {
            if (!$shift->start_time || !$shift->end_time) {
                return;
            }

            $overlap = static::where('guard_id', $shift->guard_id)
                ->where('status', '!=', 'cancelled')
                ->where('id', '!=', $shift->id ?? 0)
                ->where(function ($q) use ($shift) {
                    $q->where('start_time', '<', $shift->end_time)
                      ->where('end_time', '>', $shift->start_time);
                })
                ->exists();

            if ($overlap) {
                throw ValidationException::withMessages([
                    'start_time' => 'Overlapping shift exists for this guard at the selected time.',
                ]);
            }
        });
    }

    protected $fillable = [
        'guard_id',
        'client_site_id',
        'assigned_by',
        'date',
        'start_time',
        'end_time',
        'shift_type',
        'source',
        'instructions',
        'status',
        'notes',
        'reason_for_cancellation',
        'actual_start_time',
        'actual_end_time',
        'is_overtime',
        'overtime_hours',
        'approved_by',
        'approved_at',
    ];

    protected $casts = [
        'date' => 'date',
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'actual_start_time' => 'datetime',
        'actual_end_time' => 'datetime',
        'approved_at' => 'datetime',
        'is_overtime' => 'boolean',
        'overtime_hours' => 'decimal:2',
    ];

    protected $appends = [
        'duration',
        'actual_duration',
        'status_color',
        'status_badge',
        'is_late',
        'is_completed',
        'can_start',
        'can_end',
        'can_cancel'
    ];

    // Relationships
    public function guardRelation(): BelongsTo
    {
        return $this->belongsTo(Guard::class, 'guard_id');
    }

    // legacy alias intentionally removed — use guardRelation() to avoid colliding with Eloquent internals

    public function clientSite(): BelongsTo
    {
        return $this->belongsTo(ClientSite::class);
    }

    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function attendance(): HasMany
    {
        return $this->hasMany(Attendance::class, 'guard_id', 'guard_id');
    }

    // Scopes
    public function scopeToday($query)
    {
        return $query->whereDate('date', today());
    }

    public function scopeUpcoming($query)
    {
        return $query->whereDate('date', '>=', today())->orderBy('date');
    }

    public function scopeScheduled($query)
    {
        return $query->where('date', '>=', today())
                    ->where('status', 'scheduled');
    }

    public function scopeActive($query)
    {
        return $query->whereIn('status', ['scheduled', 'in_progress']);
    }

    public function scopePending($query)
    {
        return $query->whereNull('approved_at');
    }

    public function scopeApproved($query)
    {
        return $query->whereNotNull('approved_at');
    }

    public function scopeForSupervisor($query)
    {
        if (Auth::user()->hasRole('supervisor')) {
            return $query->whereHas('guardRelation', function($q) {
                $q->where('supervisor_id', Auth::id());
            });
        }
        return $query;
    }

    // Accessors
    public function getDurationAttribute(): ?float
    {
        if (!$this->start_time || !$this->end_time) {
            return null;
        }

        return Carbon::parse($this->end_time)->diffInHours(Carbon::parse($this->start_time), true);
    }

    public function getActualDurationAttribute(): ?float
    {
        if (!$this->actual_start_time || !$this->actual_end_time) {
            return null;
        }

        return Carbon::parse($this->actual_end_time)->diffInHours(Carbon::parse($this->actual_start_time), true);
    }

    public function getStatusColorAttribute(): string
    {
        return match($this->status) {
            'scheduled' => 'yellow',
            'in_progress' => 'blue',
            'completed' => 'green',
            'cancelled' => 'red',
            'missed' => 'gray',
            default => 'gray',
        };
    }

    public function getStatusBadgeAttribute(): array
    {
        return match($this->status) {
            'scheduled' => ['color' => 'yellow', 'icon' => 'calendar', 'text' => 'Scheduled'],
            'in_progress' => ['color' => 'blue', 'icon' => 'clock', 'text' => 'In Progress'],
            'completed' => ['color' => 'green', 'icon' => 'check-circle', 'text' => 'Completed'],
            'cancelled' => ['color' => 'red', 'icon' => 'x-circle', 'text' => 'Cancelled'],
            'missed' => ['color' => 'gray', 'icon' => 'exclamation-circle', 'text' => 'Missed'],
            default => ['color' => 'gray', 'icon' => 'question-mark-circle', 'text' => 'Unknown'],
        };
    }

    public function getIsLateAttribute(): bool
    {
        if (!$this->actual_start_time || !$this->start_time) {
            return false;
        }

        return Carbon::parse($this->actual_start_time)->gt(Carbon::parse($this->start_time)->addMinutes(15));
    }

    public function getIsCompletedAttribute(): bool
    {
        return $this->status === 'completed';
    }

    public function getCanStartAttribute(): bool
    {
        if (!Auth::check()) return false;

        if ($this->status !== 'scheduled') return false;
        if (!$this->date || !method_exists($this->date, 'isToday') || !$this->date->isToday()) return false;
        if (!$this->start_time || !$this->end_time) return false;

        return Carbon::now()->between(
            Carbon::parse($this->start_time)->subHours(1),
            Carbon::parse($this->end_time)
        );
    }

    public function getCanEndAttribute(): bool
    {
        if (!Auth::check()) return false;

        if ($this->status !== 'in_progress') return false;
        if (!$this->date || !method_exists($this->date, 'isToday') || !$this->date->isToday()) return false;
        return !is_null($this->actual_start_time);
    }

    public function getCanCancelAttribute(): bool
    {
        if (!Auth::check()) return false;

        if (!in_array($this->status, ['scheduled', 'in_progress'], true)) return false;

        $user = Auth::user();
        if (!$user) return false;

        if (method_exists($user, 'hasRole') && $user->hasRole('admin')) {
            return true;
        }

        $isSupervisor = method_exists($user, 'hasRole') ? $user->hasRole('supervisor') : false;
        if (!$isSupervisor) return false;

        $guardSupervisorId = $this->guardRelation?->supervisor_id;
        return $guardSupervisorId !== null && (int) $guardSupervisorId === (int) Auth::id();
    }

    /**
     * Scope to find overlapping shifts for a guard within a time range.
     */
    public function scopeOverlapping($query, int $guardId, $startTime, $endTime, ?int $excludeId = null)
    {
        $query->where('guard_id', $guardId)
            ->where('status', '!=', 'cancelled')
            ->where(function ($q) use ($startTime, $endTime) {
                $q->where('start_time', '<', $endTime)
                  ->where('end_time', '>', $startTime);
            });

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        return $query;
    }

    /**
     * Check if a shift overlaps with existing shifts for the same guard.
     */
    public static function hasOverlap(int $guardId, $startTime, $endTime, ?int $excludeId = null): bool
    {
        return static::overlapping($guardId, $startTime, $endTime, $excludeId)->exists();
    }

    /**
     * Validate that a shift does not overlap with existing shifts.
     * Returns the error message string if overlap exists, null otherwise.
     */
    public static function validateNoOverlap(int $guardId, $startTime, $endTime, ?int $excludeId = null): ?string
    {
        if (static::hasOverlap($guardId, $startTime, $endTime, $excludeId)) {
            return 'Overlapping shift exists for this guard at the selected time.';
        }
        return null;
    }

    // Methods
    public function start(): bool
    {
        if (!$this->can_start) {
            return false;
        }

        $this->status = 'in_progress';
        $this->actual_start_time = now();
        $this->save();

        // Create attendance record
        $this->attendance()->create([
            'guard_id' => $this->guard_id,
            'client_site_id' => $this->client_site_id,
            'date' => $this->date,
            'check_in_time' => now(),
            'status' => $this->is_late ? 'late' : 'present',
        ]);

        return true;
    }

    public function end(): bool
    {
        if (!$this->can_end) {
            return false;
        }

        $this->status = 'completed';
        $this->actual_end_time = now();
        
        // Calculate overtime if applicable
        if (Carbon::parse($this->actual_end_time)->gt(Carbon::parse($this->end_time))) {
            $this->is_overtime = true;
            $this->overtime_hours = Carbon::parse($this->actual_end_time)
                ->diffInHours(Carbon::parse($this->end_time), true);
        }

        $this->save();

        // Update attendance record
        $attendance = $this->attendance()->latest()->first();
        if ($attendance) {
            $attendance->update([
                'check_out_time' => now(),
                'hours_worked' => $this->actual_duration,
                'overtime_hours' => $this->overtime_hours,
            ]);
        }

        return true;
    }

    public function cancel(string $reason): bool
    {
        if (!$this->can_cancel) {
            return false;
        }

        $this->status = 'cancelled';
        $this->reason_for_cancellation = $reason;
        $this->save();

        return true;
    }

    public function approve(): bool
    {
        if (!Auth::user()->hasRole('admin')) {
            return false;
        }

        $this->approved_by = Auth::id();
        $this->approved_at = now();
        $this->save();

        return true;
    }
}
