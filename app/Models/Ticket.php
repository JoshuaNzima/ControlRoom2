<?php

namespace App\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Ticket extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'title',
        'description',
        'status',
        'priority',
        'category',
        'reported_by',
        'assigned_to',
        'due_date',
        'resolution',
        'escalation_level',
        'parent_ticket_id'
    ];

    protected $casts = [
        'due_date' => 'datetime',
        'meta' => 'array'
    ];

    const STATUSES = ['open', 'in_progress', 'pending', 'resolved', 'closed', 'escalated'];
    const PRIORITIES = ['low', 'medium', 'high', 'critical'];
    const CATEGORIES = ['complaint', 'incident', 'request', 'maintenance', 'emergency'];

    public function reporter()
    {
        return $this->belongsTo(User::class, 'reported_by');
    }

    public function assignee()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function comments()
    {
        return $this->hasMany(TicketComment::class);
    }

    public function attachments()
    {
        return $this->hasMany(TicketAttachment::class);
    }

    public function parentTicket()
    {
        return $this->belongsTo(Ticket::class, 'parent_ticket_id');
    }

    public function childTickets()
    {
        return $this->hasMany(Ticket::class, 'parent_ticket_id');
    }

    public function scopePriority($query, $priority)
    {
        return $query->where('priority', $priority);
    }

    public function scopeStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeCategory($query, $category)
    {
        return $query->where('category', $category);
    }
}