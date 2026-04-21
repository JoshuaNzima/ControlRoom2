<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;
use Spatie\Permission\Traits\HasPermissions;
use Illuminate\Support\Collection;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;
use App\Notifications\ResetPasswordNotification as CustomResetPasswordNotification;
use App\Models\Communication\AgentStatus;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;
    use LogsActivity;
    use HasRoles, HasPermissions {
        HasRoles::hasRole insteadof HasPermissions;
        HasRoles::hasPermissionTo insteadof HasPermissions;
    }

    public function getDescriptionForEvent(string $eventName): string
    {
        return 'user.' . $eventName;
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('user')
            ->logOnly(['name', 'email', 'status', 'zone_id'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
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

    // AgentStatus / presence functionality temporarily disabled

    public function agentStatus()
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
     * Get all push subscriptions for this user.
     */
    public function pushSubscriptions()
    {
        return $this->hasMany(PushSubscription::class);
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
        return $this->hasRole('supervisor');
    }

    /**
     * Check if user is a sergeant (roaming guard supervisor).
     */
    public function isSergeant(): bool
    {
        return $this->hasRole('sergeant');
    }

    /**
     * Check if user is a supervisor or sergeant (both manage guards).
     */
    public function isGuardManager(): bool
    {
        return $this->hasRole('supervisor') || $this->hasRole('sergeant');
    }

    /**
     * Check if user is a manager.
     */
    public function isManager(): bool
    {
        return $this->hasRole('manager', 'admin');
    }

    /**
     * Get the clients this user is linked to (for client role users).
     */
    public function clients()
    {
        return $this->belongsToMany(\App\Models\Guards\Client::class, 'client_user')
            ->withPivot('role')
            ->withTimestamps();
    }

    /**
     * Check if user is a client.
     */
    public function isClient(): bool
    {
        return $this->hasRole('client');
    }

    /**
     * Check if user is an assistant.
     */
    public function isAssistant(): bool
    {
        return $this->hasRole('assistant');
    }

    /**
     * Get assistant assignments where this user is the assistant.
     */
    public function assistantAssignments()
    {
        return $this->hasMany(\App\Models\FrontOffice\AssistantAssignment::class, 'assistant_id');
    }

    /**
     * Get assistant assignments where this user is assigned to an assistant.
     */
    public function assignedAssistants()
    {
        return $this->hasMany(\App\Models\FrontOffice\AssistantAssignment::class, 'assigned_to_id');
    }

    /**
     * Get the primary assistant for this user.
     */
    public function primaryAssistant()
    {
        return $this->assignedAssistants()
            ->where('is_primary', true)
            ->where('status', 'active')
            ->first();
    }

    /**
     * Get all active assistants for this user.
     */
    public function activeAssistants()
    {
        return $this->assignedAssistants()
            ->where('status', 'active')
            ->with('assistant');
    }

    /**
     * Send the password reset notification.
     */
    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new CustomResetPasswordNotification($token));
    }
}
