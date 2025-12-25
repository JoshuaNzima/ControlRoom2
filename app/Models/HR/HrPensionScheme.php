<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HrPensionScheme extends Model
{
    use HasFactory;

    protected $table = 'hr_pension_schemes';

    protected $fillable = [
        'name', 'provider', 'plan', 'status', 'created_by',
    ];

    public function enrollments(): HasMany
    {
        return $this->hasMany(HrPensionEnrollment::class, 'hr_pension_scheme_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'created_by');
    }
}
