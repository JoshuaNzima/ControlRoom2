<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HrPolicyFile extends Model
{
    use HasFactory;

    protected $table = 'hr_policy_files';

    protected $fillable = [
        'hr_policy_id', 'filename', 'path', 'mime_type', 'size',
    ];

    public function policy(): BelongsTo
    {
        return $this->belongsTo(HrPolicy::class, 'hr_policy_id');
    }
}
