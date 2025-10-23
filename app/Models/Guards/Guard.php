<?php

namespace App\Models\Guards;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\{HasMany, BelongsTo};
use App\Models\User;
use App\Models\Guards\{Attendance, Shift};
use App\Models\Guards\GuardAssignment;
use App\Models\Flag;

class Guard extends Model
{
    use SoftDeletes;

    public function flags()
    {
        return $this->morphMany(Flag::class, 'flaggable');
    }

    protected $fillable = [
        'employee_id',
        'name',
        'zone_id',
        'phone',
        'email',
        'address',
        'id_number',
        'date_of_birth',
        'gender',
        'emergency_contact_name',
        'emergency_contact_phone',
        'status',
        'hire_date',
        'notes',
        'photo',
        'supervisor_id',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'hire_date' => 'date',
    ];

    protected $appends = ['status_color', 'is_on_duty'];

    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }

    public function zone(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Zone::class, 'zone_id');
    }

    public function scopeForSupervisor($query, $supervisorId)
    {
        return $query->where('supervisor_id', $supervisorId);
    }

    public function infractions(): HasMany
    {
        return $this->hasMany(GuardInfraction::class);
    }

    public function updateInfractionCount()
    {
        $count = $this->infractions()
            ->where('created_at', '>=', now()->subMonths(3))
            ->count();
        
        $this->infraction_count = $count;
        $this->risk_level = $this->calculateRiskLevel($count);
        $this->last_infraction_at = $this->infractions()->latest()->first()?->created_at;
        $this->save();
    }

    protected function calculateRiskLevel(int $count): string
    {
        return match(true) {
            $count >= 5 => 'high',
            $count >= 3 => 'warning',
            default => 'normal',
        };
    }

    public function recordInfraction(array $data)
    {
        $infraction = $this->infractions()->create($data);
        $this->updateInfractionCount();
        return $infraction;
    }

    public function getActiveInfractions()
    {
        return $this->infractions()
            ->where('status', '!=', 'resolved')
            ->where('created_at', '>=', now()->subMonths(3))
            ->get();
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(GuardAssignment::class);
    }
    
    public function activeAssignments(): HasMany
    {
        return $this->hasMany(GuardAssignment::class)->where('is_active', true);
    }

    public function currentAssignment()
    {
        return $this->assignments()
            ->where('is_active', true)
            ->where('start_date', '<=', today())
            ->where(function ($q) {
                $q->whereNull('end_date')->orWhere('end_date', '>=', today());
            })->first();
    }

    public function attendance(): HasMany
    {
        return $this->hasMany(Attendance::class, 'guard_id');
    }

    public function shifts(): HasMany
    {
        return $this->hasMany(Shift::class);
    }

    public function todayAttendance()
    {
        return $this->hasMany(Attendance::class, 'guard_id')->whereDate('date', today());
    }

    public function todayShift()
    {
        return $this->shifts()->whereDate('date', today());
    }

    public function getStatusColorAttribute(): string
    {
        return match ($this->status) {
            'active' => 'green',
            'inactive' => 'gray',
            'suspended' => 'red',
            default => 'gray',
        };
    }

    public function getIsOnDutyAttribute(): bool
    {
        $today = $this->todayAttendance()->first();
        return $today && $today->check_in_time && !$today->check_out_time;
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeOnDuty($query)
    {
        return $query->whereHas('todayAttendance', function ($q) {
            $q->whereNotNull('check_in_time')->whereNull('check_out_time');
        });
    }
}