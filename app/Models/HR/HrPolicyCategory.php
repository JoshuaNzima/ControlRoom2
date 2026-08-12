<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HrPolicyCategory extends Model
{
    use HasFactory;

    protected $table = 'hr_policy_categories';

    protected $fillable = [
        'name', 'slug', 'description',
    ];

    public function policies()
    {
        return $this->hasMany(HrPolicy::class, 'hr_policy_category_id');
    }
}
