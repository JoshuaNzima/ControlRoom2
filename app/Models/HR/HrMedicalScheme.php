<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HrMedicalScheme extends Model
{
    use HasFactory;

    protected $table = 'hr_medical_schemes';

    protected $fillable = [
        'name', 'provider', 'plan', 'status', 'created_by',
    ];

    public function memberships(): HasMany
    {
        return $this->hasMany(HrMedicalMembership::class, 'hr_medical_scheme_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'created_by');
    }
}
