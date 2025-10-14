<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ticket extends Model
{
    use HasFactory;

    protected $fillable = [
        'ticket_number',
        'title',
        'category',
        'priority',
        'description',
        'status',
        'reported_by',
        'assigned_to',
        'client_id',
        'client_site_id',
        'closed_at',
        'closed_by',
    ];

    protected $casts = [
        'closed_at' => 'datetime',
    ];

    protected $appends = ['assignee'];

    const STATUSES = ['open', 'in_progress', 'pending', 'resolved', 'closed', 'escalated'];
    const PRIORITIES = ['low', 'medium', 'high', 'critical'];
    const CATEGORIES = ['complaint', 'incident', 'request', 'maintenance', 'emergency'];

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reported_by');
    }

    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function clientSite(): BelongsTo
    {
        return $this->belongsTo(ClientSite::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(TicketComment::class);
    }

    public function closedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'closed_by');
    }

    // Helper accessor to match frontend expectations (ticket.assignee)
    public function getAssigneeAttribute()
    {
        return $this->assignedTo;
    }
}