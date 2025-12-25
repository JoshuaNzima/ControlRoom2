<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\Guards\Guard;
use App\Models\Guards\Attendance;
use App\Models\Guards\GuardOffDay;
use App\Models\Holiday;
use App\Models\JobPosting;
use App\Models\JobApplication;
use App\Models\Interview;
use App\Models\Guards\GuardInfraction;
use App\Models\HR\GuardChecklist;
use App\Models\HR\GuardChecklistItem;
use App\Models\HR\ChecklistTemplate;
use App\Models\HR\HrBenefitEnrollment;
use App\Models\HR\HrCompChange;
use App\Models\HR\HrSafetyIncident;
use App\Models\HR\HrMedicalMembership;
use App\Models\HR\HrPensionEnrollment;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $today = Carbon::today();
        $in30 = $today->copy()->addDays(30);
        $now = Carbon::now();

        // Filters
        $windowParam = (string) $request->query('window', '30d');
        $windowDays = match ($windowParam) {
            '7d' => 7,
            '90d' => 90,
            default => 30,
        };
        $trendMode = (string) $request->query('trend', 'week'); // week|month
        $windowStart = $today->copy()->subDays($windowDays);

        $counts = [
            'total_guards' => Guard::count(),
            'active_guards' => Guard::where('status', 'active')->count(),
            'suspended_guards' => Guard::where('status', 'suspended')->count(),
            'drivers' => Guard::where('employee_role', 'driver')->count(),
            'guards' => Guard::where('employee_role', 'guard')->count(),
            'off_days_this_month' => GuardOffDay::whereBetween('start_date', [
                $today->copy()->startOfMonth()->toDateString(),
                $today->copy()->endOfMonth()->toDateString(),
            ])->count(),
            'on_duty_now' => Guard::onDuty()->count(),
            'hires_window' => Guard::whereNotNull('hire_date')->where('hire_date', '>=', $windowStart->toDateString())->count(),
            // Approximate exits by last status change to inactive within window
            'exits_window' => Guard::where('status', 'inactive')->where('updated_at', '>=', $now->copy()->subDays($windowDays))->count(),
        ];

        // Trend data (net changes per period)
        $trend = [
            'mode' => $trendMode,
            'labels' => [],
            'hires' => [],
            'exits' => [],
            'net' => [],
        ];
        if ($trendMode === 'month') {
            // Last 6 calendar months (including current)
            for ($i = 5; $i >= 0; $i--) {
                $start = $today->copy()->startOfMonth()->subMonths($i);
                $end = $start->copy()->endOfMonth();
                $label = $start->format('M');
                $h = Guard::whereNotNull('hire_date')->whereBetween('hire_date', [$start->toDateString(), $end->toDateString()])->count();
                $e = Guard::where('status', 'inactive')->whereBetween('updated_at', [$start->copy()->startOfDay(), $end->copy()->endOfDay()])->count();
                $trend['labels'][] = $label;
                $trend['hires'][] = $h;
                $trend['exits'][] = $e;
                $trend['net'][] = $h - $e;
            }
        } else {
            // Weekly: last 8 weeks
            $weekEnd = $today->copy()->endOfWeek();
            for ($i = 7; $i >= 0; $i--) {
                $end = $weekEnd->copy()->subWeeks($i);
                $start = $end->copy()->startOfWeek();
                $label = $start->format('d M');
                $h = Guard::whereNotNull('hire_date')->whereBetween('hire_date', [$start->toDateString(), $end->toDateString()])->count();
                $e = Guard::where('status', 'inactive')->whereBetween('updated_at', [$start->copy()->startOfDay(), $end->copy()->endOfDay()])->count();
                $trend['labels'][] = $label;
                $trend['hires'][] = $h;
                $trend['exits'][] = $e;
                $trend['net'][] = $h - $e;
            }
        }

        // Upcoming holidays (next 30 days): fixed-date and recurring
        $fixedHolidays = Holiday::where('is_recurring', false)
            ->whereBetween('date', [$today->toDateString(), $in30->toDateString()])
            ->orderBy('date')
            ->get(['id', 'name', 'date', 'type', 'is_recurring']);

        $recurringHolidays = Holiday::where('is_recurring', true)
            ->get(['id', 'name', 'date', 'type', 'is_recurring']);

        $upcomingHolidays = [];
        foreach ($fixedHolidays as $h) {
            $upcomingHolidays[] = [
                'id' => $h->id,
                'name' => $h->name,
                'date' => Carbon::parse($h->date)->toDateString(),
                'type' => $h->type,
                'is_recurring' => false,
            ];
        }

        if ($recurringHolidays->isNotEmpty()) {
            $period = CarbonPeriod::create($today->toDateString(), $in30->toDateString());
            foreach ($period as $day) {
                foreach ($recurringHolidays as $h) {
                    $hDate = Carbon::parse($h->date);
                    if ($day->month === $hDate->month && $day->day === $hDate->day) {
                        $upcomingHolidays[] = [
                            'id' => $h->id,
                            'name' => $h->name,
                            'date' => $day->toDateString(),
                            'type' => $h->type,
                            'is_recurring' => true,
                        ];
                    }
                }
            }
        }
        usort($upcomingHolidays, fn($a, $b) => strcmp($a['date'], $b['date']));
        $upcomingHolidays = array_slice($upcomingHolidays, 0, 10);

        // Upcoming off-days (next 7 days) overlapping the window
        $end7 = $today->copy()->addDays(7);
        $offDays = GuardOffDay::with('guard:id,name,employee_id')
            ->whereDate('start_date', '<=', $end7->toDateString())
            ->where(function ($q) use ($today) {
                $q->whereNull('end_date')->orWhereDate('end_date', '>=', $today->toDateString());
            })
            ->orderBy('start_date', 'desc')
            ->limit(15)
            ->get();

        $upcomingOffDays = $offDays->map(function ($off) {
            $start = Carbon::parse($off->start_date)->toDateString();
            $end = $off->end_date ? Carbon::parse($off->end_date)->toDateString() : $off->start_date;
            return [
                'id' => $off->id,
                'guard' => $off->guard ? [
                    'id' => $off->guard->id,
                    'name' => $off->guard->name,
                    'employee_id' => $off->guard->employee_id,
                ] : null,
                'start_date' => $start,
                'end_date' => $end,
                'reason' => $off->reason,
            ];
        });

        $jobsPublishedCount = JobPosting::where('status', 'published')->count();
        $jobsDraftCount = JobPosting::where('status', 'draft')->count();
        $jobsRecent = JobPosting::orderByDesc('posted_at')
            ->orderByDesc('created_at')
            ->limit(5)
            ->get(['id', 'title', 'status', 'posted_at']);

        // Recruitment: applicant status counts within window
        $statusKeys = ['applied','screening','interview','offered','hired','rejected'];
        $applicantCounts = [];
        foreach ($statusKeys as $s) {
            $applicantCounts[$s] = JobApplication::where('status', $s)
                ->where('created_at', '>=', $windowStart->copy()->startOfDay())
                ->count();
        }

        // Upcoming interviews (7 days)
        $upcomingInterviews = Interview::with(['application:id,job_posting_id,candidate_name,status','application.jobPosting:id,title'])
            ->where('status', 'scheduled')
            ->whereBetween('scheduled_at', [$today->copy()->startOfDay(), $today->copy()->addDays(7)->endOfDay()])
            ->orderBy('scheduled_at')
            ->limit(20)
            ->get()
            ->map(function ($iv) {
                return [
                    'id' => $iv->id,
                    'scheduled_at' => optional($iv->scheduled_at)->toDateTimeString(),
                    'mode' => $iv->mode,
                    'location_or_link' => $iv->location_or_link,
                    'status' => $iv->status,
                    'candidate' => $iv->application ? [
                        'name' => $iv->application->candidate_name,
                        'status' => $iv->application->status,
                        'job' => $iv->application->jobPosting ? [
                            'id' => $iv->application->jobPosting->id,
                            'title' => $iv->application->jobPosting->title,
                        ] : null,
                    ] : null,
                ];
            });

        // For quick schedule modal: recent/pending applications
        $applicationsForSchedule = JobApplication::with('jobPosting:id,title')
            ->orderByDesc('created_at')
            ->limit(30)
            ->get(['id','job_posting_id','candidate_name','status'])
            ->map(function ($a) {
                return [
                    'id' => $a->id,
                    'candidate_name' => $a->candidate_name,
                    'status' => $a->status,
                    'job' => $a->jobPosting ? [
                        'id' => $a->jobPosting->id,
                        'title' => $a->jobPosting->title,
                    ] : null,
                ];
            });

        // Infractions performance: trend, top guards, follow-ups
        $infraTrend = [
            'mode' => $trendMode,
            'labels' => [],
            'counts' => [],
        ];
        if ($trendMode === 'month') {
            for ($i = 5; $i >= 0; $i--) {
                $start = $today->copy()->startOfMonth()->subMonths($i);
                $end = $start->copy()->endOfMonth();
                $label = $start->format('M');
                $c = GuardInfraction::whereBetween('created_at', [$start->copy()->startOfDay(), $end->copy()->endOfDay()])->count();
                $infraTrend['labels'][] = $label;
                $infraTrend['counts'][] = $c;
            }
        } else {
            $weekEnd = $today->copy()->endOfWeek();
            for ($i = 7; $i >= 0; $i--) {
                $end = $weekEnd->copy()->subWeeks($i);
                $start = $end->copy()->startOfWeek();
                $label = $start->format('d M');
                $c = GuardInfraction::whereBetween('created_at', [$start->copy()->startOfDay(), $end->copy()->endOfDay()])->count();
                $infraTrend['labels'][] = $label;
                $infraTrend['counts'][] = $c;
            }
        }

        $topInfractions = GuardInfraction::with('guardRelation:id,name,employee_id')
            ->where('created_at', '>=', $windowStart->copy()->startOfDay())
            ->select('guard_id', DB::raw('COUNT(*) as cnt'), DB::raw('MAX(incident_date) as last_incident_at'))
            ->groupBy('guard_id')
            ->orderByDesc('cnt')
            ->limit(5)
            ->get()
            ->map(function ($row) {
                return [
                    'guard' => $row->guardRelation ? [
                        'id' => $row->guardRelation->id,
                        'name' => $row->guardRelation->name,
                        'employee_id' => $row->guardRelation->employee_id,
                    ] : null,
                    'count' => (int) $row->cnt,
                    'last_incident_at' => optional(Carbon::parse($row->last_incident_at))->toDateTimeString(),
                ];
            });

        $followUps = GuardInfraction::with('guardRelation:id,name,employee_id')
            ->whereIn('status', ['pending','reviewed'])
            ->orderByDesc('incident_date')
            ->limit(20)
            ->get(['id','guard_id','type','severity','incident_date','status'])
            ->map(function ($i) {
                return [
                    'id' => $i->id,
                    'type' => $i->type,
                    'severity' => $i->severity,
                    'incident_date' => optional($i->incident_date)->toDateTimeString(),
                    'status' => $i->status,
                    'guard' => $i->guardRelation ? [
                        'id' => $i->guardRelation->id,
                        'name' => $i->guardRelation->name,
                        'employee_id' => $i->guardRelation->employee_id,
                    ] : null,
                ];
            });

        // Checklists: counts and due items
        $onboardingActive = GuardChecklist::where('type','onboarding')->where('status','active')->count();
        $offboardingActive = GuardChecklist::where('type','offboarding')->where('status','active')->count();
        $in7 = $today->copy()->addDays(7);
        $dueSoonCount = GuardChecklistItem::where('status','pending')
            ->whereBetween('due_date', [$today->toDateString(), $in7->toDateString()])
            ->count();
        $overdueCount = GuardChecklistItem::where('status','pending')
            ->whereDate('due_date', '<', $today->toDateString())
            ->count();
        $dueItems = GuardChecklistItem::with(['checklist.guard:id,name,employee_id','checklist:id,guard_id,type'])
            ->where('status','pending')
            ->whereNotNull('due_date')
            ->orderBy('due_date')
            ->limit(10)
            ->get(['id','guard_checklist_id','title','due_date'])
            ->map(function ($it) {
                return [
                    'id' => $it->id,
                    'title' => $it->title,
                    'due_date' => optional($it->due_date)->toDateString(),
                    'checklist' => $it->checklist ? [
                        'type' => $it->checklist->type,
                        'guard' => $it->checklist->guard ? [
                            'id' => $it->checklist->guard->id,
                            'name' => $it->checklist->guard->name,
                            'employee_id' => $it->checklist->guard->employee_id,
                        ] : null,
                    ] : null,
                ];
            });

        $checklistTemplates = ChecklistTemplate::where('active', true)->orderBy('name')->get(['id','name','type']);

        // Guards list for quick-add off day modal
        $guards = Guard::active()
            ->orderBy('name')
            ->get(['id', 'name', 'employee_id']);

        // Compliance: missing HR data counts
        $missingEmail = Guard::whereNull('email')->orWhere('email', '')->count();
        $missingPhone = Guard::whereNull('phone')->orWhere('phone', '')->count();
        $missingDob = Guard::whereNull('date_of_birth')->count();
        $missingIdNumber = Guard::whereNull('id_number')->orWhere('id_number', '')->count();
        $missingHireDate = Guard::whereNull('hire_date')->count();
        $missingEmergency = Guard::whereNull('emergency_contact_phone')->orWhere('emergency_contact_phone', '')->count();

        $incompleteProfiles = Guard::query()
            ->where(function ($q) {
                $q->whereNull('email')->orWhere('email', '')
                  ->orWhereNull('phone')->orWhere('phone', '')
                  ->orWhereNull('date_of_birth')
                  ->orWhereNull('id_number')->orWhere('id_number', '')
                  ->orWhereNull('hire_date')
                  ->orWhereNull('emergency_contact_phone')->orWhere('emergency_contact_phone', '');
            })
            ->orderBy('name')
            ->limit(10)
            ->get(['id','name','employee_id','email','phone','date_of_birth','id_number','hire_date','emergency_contact_phone'])
            ->map(function ($g) {
                $missing = [];
                if (empty($g->email)) $missing[] = 'email';
                if (empty($g->phone)) $missing[] = 'phone';
                if (empty($g->date_of_birth)) $missing[] = 'date_of_birth';
                if (empty($g->id_number)) $missing[] = 'id_number';
                if (empty($g->hire_date)) $missing[] = 'hire_date';
                if (empty($g->emergency_contact_phone)) $missing[] = 'emergency_contact';
                return [
                    'id' => $g->id,
                    'name' => $g->name,
                    'employee_id' => $g->employee_id,
                    'missing' => $missing,
                ];
            });

        // Upcoming birthdays (next 30 days)
        $allWithDob = Guard::whereNotNull('date_of_birth')->get(['id','name','employee_id','date_of_birth']);
        $upcomingBirthdays = [];
        foreach ($allWithDob as $g) {
            $dob = Carbon::parse($g->date_of_birth);
            $thisYear = Carbon::create($today->year, $dob->month, $dob->day);
            // If birthday has passed this year but within the next 30 days next year
            if ($thisYear->lt($today)) {
                $thisYear->addYear();
            }
            if ($thisYear->betweenIncluded($today, $in30)) {
                $upcomingBirthdays[] = [
                    'id' => $g->id,
                    'name' => $g->name,
                    'employee_id' => $g->employee_id,
                    'date' => $thisYear->toDateString(),
                ];
            }
        }
        usort($upcomingBirthdays, fn($a, $b) => strcmp($a['date'], $b['date']));
        $upcomingBirthdays = array_slice($upcomingBirthdays, 0, 10);

        // Attendance signals (today)
        $lateToday = Attendance::today()
            ->where('status', 'late')
            ->with('guardRelation:id,name,employee_id')
            ->orderBy('check_in_time')
            ->limit(20)
            ->get()
            ->map(function ($a) {
                return [
                    'id' => $a->id,
                    'guard' => $a->guardRelation ? [
                        'id' => $a->guardRelation->id,
                        'name' => $a->guardRelation->name,
                        'employee_id' => $a->guardRelation->employee_id,
                    ] : null,
                    'check_in_time' => optional($a->check_in_time)->toDateTimeString(),
                ];
            });
        $presentCount = Attendance::today()->where('status', 'present')->count();
        $lateCount = Attendance::today()->where('status', 'late')->count();
        $absentCount = Attendance::today()->where('status', 'absent')->count();

        $benefitsActive = HrBenefitEnrollment::where('status', 'active')->count();
        $compPending = HrCompChange::where('status', 'pending')->count();
        $safetyOpen = HrSafetyIncident::where('status', 'open')->count();

        return Inertia::render('HR/Dashboard', [
            'metrics' => [
                'counts' => $counts,
                'jobs' => [
                    'published_count' => $jobsPublishedCount,
                    'draft_count' => $jobsDraftCount,
                    'recent' => $jobsRecent,
                ],
                'attendance' => [
                    'present_today' => $presentCount,
                    'late_today' => $lateCount,
                    'absent_today' => $absentCount,
                    'late_list' => $lateToday,
                ],
                'trend' => $trend,
                'window' => [
                    'param' => $windowParam,
                    'days' => $windowDays,
                    'trend' => $trendMode,
                ],
                'recruitment' => [
                    'applicants' => $applicantCounts,
                    'upcoming_interviews' => $upcomingInterviews,
                ],
                'infractions' => [
                    'trend' => $infraTrend,
                    'top_guards' => $topInfractions,
                    'followups' => $followUps,
                ],
                'checklists' => [
                    'onboarding_active' => $onboardingActive,
                    'offboarding_active' => $offboardingActive,
                    'due_soon' => $dueSoonCount,
                    'overdue' => $overdueCount,
                    'due_items' => $dueItems,
                    'templates' => $checklistTemplates,
                ],
                'benefits' => [
                    'active_enrollments' => $benefitsActive,
                ],
                'medical' => [
                    'active_memberships' => HrMedicalMembership::where('status','active')->count(),
                ],
                'compensation' => [
                    'pending_changes' => $compPending,
                ],
                'safety' => [
                    'open_incidents' => $safetyOpen,
                ],
                'pensions' => [
                    'active_enrollments' => HrPensionEnrollment::where('status','active')->count(),
                ],
            ],
            'upcoming_holidays' => $upcomingHolidays,
            'upcoming_off_days' => $upcomingOffDays,
            'guards' => $guards,
            'compliance' => [
                'missing' => [
                    'email' => $missingEmail,
                    'phone' => $missingPhone,
                    'date_of_birth' => $missingDob,
                    'id_number' => $missingIdNumber,
                    'hire_date' => $missingHireDate,
                    'emergency_contact' => $missingEmergency,
                ],
                'incomplete_profiles' => $incompleteProfiles,
            ],
            'upcoming_birthdays' => $upcomingBirthdays,
            'applications_for_schedule' => $applicationsForSchedule,
        ]);
    }

    public function complianceExport(Request $request)
    {
        $filename = 'hr_compliance_missing_' . now()->format('Ymd_His') . '.csv';
        $rows = [];
        $rows[] = ['ID','Name','Employee ID','Missing Fields'];

        $guards = Guard::query()
            ->orderBy('name')
            ->get(['id','name','employee_id','email','phone','date_of_birth','id_number','hire_date','emergency_contact_phone']);

        foreach ($guards as $g) {
            $missing = [];
            if (empty($g->email)) $missing[] = 'email';
            if (empty($g->phone)) $missing[] = 'phone';
            if (empty($g->date_of_birth)) $missing[] = 'date_of_birth';
            if (empty($g->id_number)) $missing[] = 'id_number';
            if (empty($g->hire_date)) $missing[] = 'hire_date';
            if (empty($g->emergency_contact_phone)) $missing[] = 'emergency_contact';
            if (count($missing) === 0) continue;
            $rows[] = [$g->id, $g->name, $g->employee_id, implode('|', $missing)];
        }

        $callback = function () use ($rows) {
            $FH = fopen('php://output', 'w');
            foreach ($rows as $r) fputcsv($FH, $r);
            fclose($FH);
        };

        return response()->streamDownload($callback, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }
}
