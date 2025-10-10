<?php

namespace App\Models;

use Carbon\Carbon;
use App\Models\Guards\Guard;
use App\Models\Guards\ClientSite;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Zone extends Model
{
    protected $fillable = [
        'name',
        'code',
        'description',
        'status',
        'required_guard_count'  // New field for target guard count
    ];

    protected $appends = ['coverage_rate', 'active_guard_count'];

    public function commander()
    {
        return $this->hasOne(User::class)->role('zone_commander');
    }

    public function sites()
    {
        return $this->hasMany(ClientSite::class);
    }

    public function guards()
    {
        return $this->hasManyThrough(Guard::class, ClientSite::class);
    }

    public function getCoverageRateAttribute()
    {
        if (!$this->required_guard_count) return 0;
        
        $activeGuards = $this->getActiveGuardCountAttribute();
        return round(($activeGuards / $this->required_guard_count) * 100, 1);
    }

    public function getActiveGuardCountAttribute()
    {
        return $this->guards()
            ->where('status', 'active')
            ->whereHas('currentAssignment', function($query) {
                $query->whereNull('end_date');
            })
            ->count();
    }

    public function getDailyAttendanceRate(string $date = null)
    {
        $date = $date ? Carbon::parse($date) : today();
        
        $expectedGuards = $this->getActiveGuardCountAttribute();
        if ($expectedGuards === 0) return 0;

        $presentGuards = $this->guards()
            ->whereHas('attendance', function($query) use ($date) {
                $query->whereDate('date', $date)
                    ->whereNotNull('check_in_time');
            })
            ->count();

        return round(($presentGuards / $expectedGuards) * 100, 1);
    }

    public function getZoneCoverageStats(int $days = 7)
    {
        $stats = [];
        for ($i = $days - 1; $i >= 0; $i--) {
            $date = today()->subDays($i);
            $stats[] = [
                'date' => $date->format('M d'),
                'coverage_rate' => $this->getCoverageRateAttribute(),
                'attendance_rate' => $this->getDailyAttendanceRate($date),
                'active_guards' => $this->getActiveGuardCountAttribute(),
                'required_guards' => $this->required_guard_count,
                'present_guards' => $this->guards()
                    ->whereHas('attendance', function($query) use ($date) {
                        $query->whereDate('date', $date)
                            ->whereNotNull('check_in_time');
                    })
                    ->count(),
            ];
        }
        return $stats;
    }
}