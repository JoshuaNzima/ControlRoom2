<?php

namespace App\Models\Guards;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\{HasMany, BelongsTo, BelongsToMany, HasOne};
use App\Models\User;
use App\Models\ClientSite;
use App\Models\Guards\{Attendance, Shift};
use App\Models\Guards\GuardAssignment;
use App\Models\Guards\GuardGrade;
use App\Models\Flag;
use App\Models\Training\RefresherTrainingRecord;

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
        'residence_address',
        'residence_city',
        'residence_district',
        'id_number',
        'date_of_birth',
        'gender',
        'marital_status',
        'spouse_name',
        'spouse_phone',
        'emergency_contact_name',
        'emergency_contact_phone',
        'next_of_kin_name',
        'next_of_kin_relationship',
        'next_of_kin_phone',
        'status',
        'employee_role',
        'guard_type',
        'guard_grade_id',
        'home_village',
        'home_ta',
        'home_district',
        'education_level',
        'qualifications',
        'languages',
        'dependents_count',
        'hire_date',
        'notes',
        'fingerprint_registered',
        'uniform_issued',
        'equipment_issued',
        'photo',
        'last_known_location',
        'supervisor_id',
        'reports_to_guard_id',
        'position',
        'is_leader',
        'default_off_day',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'hire_date' => 'date',
        'qualifications' => 'array',
        'languages' => 'array',
        'dependents_count' => 'integer',
        'last_known_location' => 'array',
        'position' => 'string',
        'is_leader' => 'boolean',
        'default_off_day' => 'integer',
        'fingerprint_registered' => 'boolean',
        'uniform_issued' => 'boolean',
        'equipment_issued' => 'array',
    ];

    protected $appends = ['status_color', 'is_on_duty', 'photo_url', 'is_profile_complete', 'profile_missing_fields'];

    protected static function booted(): void
    {
        static::creating(function (self $guard) {
            if (empty($guard->employee_id)) {
                $guard->employee_id = self::generateEmployeeId();
            }
        });
    }

    public static function generateEmployeeId(): string
    {
        do {
            $candidate = 'G-' . now()->format('ym') . '-' . sprintf('%04d', random_int(0, 9999));
        } while (self::where('employee_id', $candidate)->exists());
        return $candidate;
    }

    public function getPhotoUrlAttribute(): ?string
    {
        if (empty($this->photo)) return null;
        return asset('storage/' . ltrim($this->photo, '/'));
    }

    public function getProfileMissingFieldsAttribute(): array
    {
        $missing = [];

        if (blank($this->id_number)) {
            $missing[] = 'id_number';
        }
        if (blank($this->emergency_contact_name)) {
            $missing[] = 'emergency_contact_name';
        }
        if (blank($this->emergency_contact_phone)) {
            $missing[] = 'emergency_contact_phone';
        }

        return $missing;
    }

    public function getIsProfileCompleteAttribute(): bool
    {
        return count($this->profile_missing_fields) === 0;
    }

    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }

    public function reportsTo(): BelongsTo
    {
        return $this->belongsTo(Guard::class, 'reports_to_guard_id');
    }

    public function incentiveProfile(): HasOne
    {
        return $this->hasOne(\App\Models\SupervisorIncentiveProfile::class);
    }

    public function incentiveRecords(): HasMany
    {
        return $this->hasMany(\App\Models\SupervisorIncentiveRecord::class);
    }

    public function subordinates(): HasMany
    {
        return $this->hasMany(Guard::class, 'reports_to_guard_id');
    }

    public function scopeSupervisors($query)
    {
        return $query->where('position', 'supervisor');
    }

    public function scopeSergeants($query)
    {
        return $query->where('position', 'sergeant');
    }

    public function scopeLeaders($query)
    {
        return $query->whereIn('position', ['supervisor', 'sergeant']);
    }

    public function isLeader(): bool
    {
        return in_array($this->position, ['supervisor', 'sergeant']);
    }

    public function zone(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Zone::class, 'zone_id');
    }

    public function grade(): BelongsTo
    {
        return $this->belongsTo(GuardGrade::class, 'guard_grade_id');
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

    public function sites(): BelongsToMany
    {
        return $this->belongsToMany(
            ClientSite::class,
            'guard_assignments',
            'guard_id',
            'client_site_id'
        )
            ->withPivot(['assigned_by', 'start_date', 'end_date', 'assignment_type', 'notes', 'is_active', 'active'])
            ->withTimestamps()
            ->wherePivot('is_active', true);
    }

    public function currentAssignmentRelation(): HasOne
    {
        return $this->hasOne(GuardAssignment::class, 'guard_id')
            ->where('is_active', true)
            ->where('start_date', '<=', today())
            ->where(function ($q) {
                $q->whereNull('end_date')->orWhere('end_date', '>=', today());
            })->latest('start_date');
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

    public function currentShift()
    {
         return $this->hasOne(Shift::class)
            ->whereIn('status', ['scheduled', 'in_progress'])
            ->where(function ($q) {
                $q->whereDate('date', today())
                  ->orWhere(function ($q2) {
                      $q2->whereDate('date', today()->subDay())
                         ->where('status', 'in_progress');
                  });
            });
    }

    public function currentSite()
    {
        return $this->belongsTo(ClientSite::class, 'current_site_id');
    }

    public function todayAttendance()
    {
        return $this->hasMany(Attendance::class, 'guard_id')->whereDate('date', today());
    }

    public function todayShift()
    {
        return $this->shifts()->whereDate('date', today());
    }

    public function refresherTrainingRecords(): HasMany
    {
        return $this->hasMany(RefresherTrainingRecord::class, 'guard_id');
    }

    public function getStatusColorAttribute(): string
    {
        return match ($this->status) {
            'active' => 'green',
            'inactive' => 'gray',
            'suspended' => 'red',
            'dismissed' => 'gray',
            'absconded' => 'red',
            'resigned' => 'gray',
            'retired' => 'gray',
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

    public function scopeProfileStatus($query, ?string $status)
    {
        $status = $status ? strtolower(trim($status)) : null;

        if ($status === 'complete') {
            return $query
                ->whereNotNull('id_number')->where('id_number', '!=', '')
                ->whereNotNull('emergency_contact_name')->where('emergency_contact_name', '!=', '')
                ->whereNotNull('emergency_contact_phone')->where('emergency_contact_phone', '!=', '');
        }

        if ($status === 'incomplete') {
            return $query->where(function ($q) {
                $q->whereNull('id_number')->orWhere('id_number', '')
                  ->orWhereNull('emergency_contact_name')->orWhere('emergency_contact_name', '')
                  ->orWhereNull('emergency_contact_phone')->orWhere('emergency_contact_phone', '');
            });
        }

        return $query;
    }
}
