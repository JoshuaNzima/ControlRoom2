<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;
use Spatie\Permission\Traits\HasPermissions;
use Illuminate\Support\Collection;
use App\Models\Communication\AgentStatus;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;
    use HasRoles, HasPermissions {
        HasRoles::hasRole insteadof HasPermissions;
        HasRoles::hasPermissionTo insteadof HasPermissions;
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'employee_id',
        'status',
        'zone_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    /**
     * Get the user's flags.
     */
    public function flags()
    {
        return $this->morphMany(Flag::class, 'flaggable');
    }

    /**
     * Get the user's assigned zone.
     */
    public function zone()
    {
        return $this->belongsTo(Zone::class);
    }

    /**
     * Get guards managed by this user.
     */
    public function managedGuards()
    {
        if ($this->hasRole('zone_commander')) {
            return Guard::whereHas('site.zone', function($query) {
                $query->where('id', $this->zone_id);
            });
        }
        
        return Guard::where('supervisor_id', $this->id);
    }

    /**
     * Get the user's current status.
     */
    public function currentStatus()
    {
        return $this->hasOne(AgentStatus::class);
    }

    

    /**
     * Get all conversations this user is part of.
     */
    public function conversations()
    {
        return $this->belongsToMany(Conversation::class, 'conversation_participants')
            ->withTimestamps();
    }

    /**
     * Get all messages sent by this user.
     */
    public function messages()
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    /**
     * Check if user is a super admin.
     */
    public function isSuperAdmin(): bool
    {
        return $this->hasRole('super_admin');
    }

    /**
     * Check if user is an admin.
     */
    public function isAdmin(): bool
    {
        return $this->hasRole('admin');
    }

    /**
     * Check if user is a supervisor.
     */
    public function isSupervisor(): bool
    {
        return $this->hasRole('supervisor', 'admin');
    }

    /**
     * Check if user is a manager.
     */
    public function isManager(): bool
    {
        return $this->hasRole('manager', 'admin');
    }
}
