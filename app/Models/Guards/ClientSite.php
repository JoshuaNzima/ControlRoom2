<?php

namespace App\Models\Guards;

use App\Models\Camera;
use App\Models\CameraAlert;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class ClientSite extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'client_id',
        'name',
        'address',
        'contact_person',
        'phone',
        'latitude',
        'longitude',
        'special_instructions',
        'required_guards',
        'services_requested',
        'status',
        'site_type',
    ];

    protected $casts = [
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'required_guards' => 'integer',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function shifts(): HasMany
    {
        return $this->hasMany(Shift::class);
    }

    /**
     * Guards assigned to this site through GuardAssignment (many-to-many via assignments)
     */
    public function guards(): BelongsToMany
    {
        return $this->belongsToMany(Guard::class, 'guard_assignments', 'client_site_id', 'guard_id');
    }

    public function attendance(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    public function cameras(): HasMany
    {
        return $this->hasMany(Camera::class, 'client_site_id');
    }

    public function cameraAlerts(): HasManyThrough
    {
        return $this->hasManyThrough(
            CameraAlert::class,
            Camera::class,
            'client_site_id', // Foreign key on cameras table
            'camera_id'       // Foreign key on camera_alerts table
        );
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function getCurrentGuardsCount(): int
    {
        return $this->attendance()
            ->whereDate('date', today())
            ->whereNotNull('check_in_time')
            ->whereNull('check_out_time')
            ->count();
    }
}