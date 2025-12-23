<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Guards\Guard;
use App\Models\User;

class HrCompChange extends Model
{
    use HasFactory;

    protected $table = 'hr_comp_changes';

    protected $fillable = [
        'guard_id', 'hr_salary_band_id', 'amount', 'currency', 'change_type', 'effective_date', 'status', 'reason', 'created_by', 'approved_by',
    ];

    protected $casts = [
        'effective_date' => 'date',
    ];

    public function guardRelation(): BelongsTo
    {
        return $this->belongsTo(Guard::class);
    }

    public function band(): BelongsTo
    {
        return $this->belongsTo(HrSalaryBand::class, 'hr_salary_band_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
