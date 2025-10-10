<?php

namespace App\Models\Guards;

use Illuminate\Database\Eloquent\Model;

class Reliever extends Model
{
    protected $fillable = [
        'guard_id',
        'name',
        'type', 
        'status', 
        'phone',
        'email',
        'notes',
    ];


}
