<?php

namespace App\Models\HR;

use App\Models\Guards\Guard;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GuardChecklist extends Model
{
    protected $fillable = [
        'guard_id',
        'checklist_template_id',
        'type',
        'status',
        'start_date',
        'due_date',
        'completed_at',
        'assigned_by',
    ];

    protected $casts = [
        'start_date' => 'date',
        'due_date' => 'date',
        'completed_at' => 'datetime',
    ];

    public function guardRelation(): BelongsTo
    {
        return $this->belongsTo(Guard::class);
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(ChecklistTemplate::class, 'checklist_template_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(GuardChecklistItem::class);
    }
}
