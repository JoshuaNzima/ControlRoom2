<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class AiAssistantSetting extends Model
{
    protected $table = 'ai_assistant_settings';

    protected $fillable = [
        'assistant',
        'enabled',
        'title',
        'description',
    ];

    protected $casts = [
        'enabled' => 'boolean',
    ];

    public static function getActiveAssistant(): ?self
    {
        return Cache::remember('ai_active_assistant', 300, function () {
            return static::where('enabled', true)->first();
        });
    }

    public static function getEnabledAssistants()
    {
        return static::where('enabled', true)->orderBy('id')->get();
    }

    public function hasAssistant(): bool
    {
        return !empty($this->assistant);
    }

    public static function setActiveAssistant(string $assistant): void
    {
        Cache::forget('ai_active_assistant');

        static::query()->update(['enabled' => false]);

        $setting = static::firstOrCreate(
            ['assistant' => $assistant],
            ['title' => $assistant, 'description' => null, 'enabled' => true]
        );

        $setting->enabled = true;
        $setting->save();

        Cache::forget('ai_active_assistant');
    }
}
