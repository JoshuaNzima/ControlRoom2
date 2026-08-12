<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class IncentiveSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'group',
        'label',
        'description',
        'type',
        'value',
        'options',
        'is_editable',
        'sort_order',
    ];

    protected $casts = [
        'options' => 'json',
        'is_editable' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function scopeByGroup($query, string $group)
    {
        return $query->where('group', $group);
    }

    public function scopeEditable($query)
    {
        return $query->where('is_editable', true);
    }

    public function getTypedValue()
    {
        return match ($this->type) {
            'number' => (float) $this->value,
            'boolean' => (bool) $this->value,
            'json' => json_decode($this->value, true),
            default => $this->value,
        };
    }

    public function setTypedValue($value): void
    {
        $this->value = match ($this->type) {
            'json' => json_encode($value),
            'boolean' => $value ? '1' : '0',
            default => (string) $value,
        };
    }

    public static function getValue(string $key, $default = null)
    {
        $setting = static::where('key', $key)->first();
        return $setting ? $setting->getTypedValue() : $default;
    }

    public static function setValue(string $key, $value): bool
    {
        $setting = static::where('key', $key)->first();
        if (!$setting) {
            return false;
        }
        $setting->setTypedValue($value);
        return $setting->save();
    }
}
