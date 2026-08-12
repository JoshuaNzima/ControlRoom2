<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = [
        'key',
        'value',
        'module',
    ];

    protected $casts = [
        'value' => 'array',
    ];

	public static function getValue(string $key, mixed $default = null): mixed
	{
		$row = static::query()->where('key', $key)->first();
		if (!$row) {
			return $default;
		}
		return $row->value ?? $default;
	}

	public static function setValue(string $key, mixed $value, ?string $module = null): void
	{
		static::query()->updateOrCreate(
			['key' => $key],
			['value' => $value, 'module' => $module]
		);
	}

	/**
	 * Get attendance methods settings merged with config defaults.
	 */
	public static function getAttendanceMethods(): array
	{
		$defaults = [
			'auto_absent' => true,
			'auto_present' => false,
			'require_site_scan' => config('attendance.require_site_scan', false),
		];

		try {
			$row = static::where('key', 'attendance.methods')->first();
			if ($row && is_array($row->value)) {
				return array_merge($defaults, $row->value);
			}
		} catch (\Throwable $e) {
			// Fall through to defaults
		}

		return $defaults;
	}

	/**
	 * Get whether site scan is required for attendance.
	 * Reads from DB setting first, falls back to config.
	 */
	public static function requireSiteScan(): bool
	{
		$methods = static::getAttendanceMethods();
		return (bool) ($methods['require_site_scan'] ?? false);
	}
}
