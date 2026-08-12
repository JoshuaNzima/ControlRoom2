<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HrPolicy extends Model
{
    use HasFactory;

    protected $table = 'hr_policies';

    protected $fillable = [
        'hr_policy_category_id',
        'title',
        'slug',
        'version',
        'effective_date',
        'published',
        'summary',
        'content',
    ];

    protected $casts = [
        'published' => 'boolean',
        'effective_date' => 'date',
    ];

    public function category()
    {
        return $this->belongsTo(HrPolicyCategory::class, 'hr_policy_category_id');
    }

    public function files(): HasMany
    {
        return $this->hasMany(HrPolicyFile::class, 'hr_policy_id');
    }
}
