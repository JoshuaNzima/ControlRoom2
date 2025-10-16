<?php

namespace App\Models;

use Carbon\Carbon;
use App\Models\Guards\Guard;
use App\Models\Guards\ClientSite;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Zone extends Model
{
    use HasFactory;
    protected $fillable = [
        'name',
        'code',
        'description',
        'status',
        'required_guard_count',
        'target_sites_count'
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
        return $this->hasMany(Guard::class);
    }

    protected function guardsBaseQuery(): Builder
    {
        return Guard::query()
            ->whereHas('assignments.clientSite', function ($q) {
                $q->where('zone_id', $this->id);
            });
    }

    public function getCoverageRateAttribute()
    {
        if (!$this->required_guard_count) return 0;
        
        $activeGuards = $this->getActiveGuardCountAttribute();
        return round(($activeGuards / $this->required_guard_count) * 100, 1);
    }

    public function getActiveGuardCountAttribute()
    {
        return $this->guardsBaseQuery()
            ->where('guards.status', 'active')
            ->whereHas('assignments', function($query) {
                $query->where('is_active', true)
                    ->where('start_date', '<=', today())
                    ->where(function($q) {
                        $q->whereNull('end_date')->orWhere('end_date', '>=', today());
                    });
            })
            ->count();
    }

    public function getDailyAttendanceRate(string $date = null)
    {
        $date = $date ? Carbon::parse($date) : today();
        
        $expectedGuards = $this->getActiveGuardCountAttribute();
        if ($expectedGuards === 0) return 0;

        $presentGuards = $this->guardsBaseQuery()
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
                'present_guards' => $this->guardsBaseQuery()
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