<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class EmergencyContact extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'type',
        'phone',
        'alternative_phone',
        'email',
        'address',
        'latitude',
        'longitude',
        'is_active',
        'notes',
        'display_order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'display_order' => 'integer',
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('display_order')->orderBy('name');
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public static function getTypeOptions(): array
    {
        return [
            'police' => 'Police Station',
            'hospital' => 'Hospital',
            'fire_station' => 'Fire Station',
            'ambulance' => 'Ambulance Service',
            'security' => 'Security Company',
            'emergency' => 'Emergency Services',
            'utility' => 'Utility Services',
            'other' => 'Other',
        ];
    }

    public function getTypeLabelAttribute(): string
    {
        return self::getTypeOptions()[$this->type] ?? $this->type;
    }

    public function getPhoneLinkAttribute(): ?string
    {
        return $this->phone ? 'tel:' . preg_replace('/[^\d+]/', '', $this->phone) : null;
    }

    public function getAlternativePhoneLinkAttribute(): ?string
    {
        return $this->alternative_phone ? 'tel:' . preg_replace('/[^\d+]/', '', $this->alternative_phone) : null;
    }
}
