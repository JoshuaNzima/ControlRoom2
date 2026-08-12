<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvoiceAuditLog extends Model
{
    protected $fillable = [
        'invoice_id',
        'user_id',
        'action',
        'field',
        'old_value',
        'new_value',
        'notes',
    ];

    protected $casts = [
        'old_value' => 'string',
        'new_value' => 'string',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Log an invoice action
     */
    public static function log(
        int $invoiceId,
        int $userId,
        string $action,
        ?string $field = null,
        ?string $oldValue = null,
        ?string $newValue = null,
        ?string $notes = null
    ): self {
        return self::create([
            'invoice_id' => $invoiceId,
            'user_id' => $userId,
            'action' => $action,
            'field' => $field,
            'old_value' => $oldValue,
            'new_value' => $newValue,
            'notes' => $notes,
        ]);
    }
}
