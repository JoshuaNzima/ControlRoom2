<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use App\Models\JobPosting;

class PageController extends Controller
{
    public function services()
    {
        $services = [
            [
                'slug' => 'security-guards',
                'title' => 'Security Guards',
                'icon' => 'Shield',
                'summary' => 'Licensed guards for corporate, retail, and industrial sites.',
                'features' => ['24/7 coverage', 'Vetted & trained', 'Post orders & reporting'],
            ],
            [
                'slug' => 'cctv-surveillance',
                'title' => 'CCTV Surveillance',
                'icon' => 'Camera',
                'summary' => 'Live monitoring with rapid incident response.',
                'features' => ['Real-time alerts', 'Cloud recording', 'Analytics'],
            ],
            [
                'slug' => 'mobile-patrol',
                'title' => 'Mobile Patrol',
                'icon' => 'Car',
                'summary' => 'Scheduled and randomized patrols with digital reports.',
                'features' => ['GPS tracked', 'Photo evidence', 'Incident escalation'],
            ],
            [
                'slug' => 'event-security',
                'title' => 'Event Security',
                'icon' => 'Calendar',
                'summary' => 'Crowd management and VIP protection for small to large events.',
                'features' => ['Access control', 'Crowd management', 'Risk assessments'],
            ],
            [
                'slug' => 'risk-consulting',
                'title' => 'Risk Consulting',
                'icon' => 'Activity',
                'summary' => 'Site assessments and tailored security strategies.',
                'features' => ['Threat modeling', 'Policy design', 'Compliance'],
            ],
            [
                'slug' => 'integrated-systems',
                'title' => 'Integrated Systems',
                'icon' => 'Cpu',
                'summary' => 'End-to-end systems: access control, alarms, and integrations.',
                'features' => ['Access control', 'Alarms', 'Third-party integrations'],
            ],
        ];

        return Inertia::render('Public/Services/Index', [
            'services' => $services,
        ]);
    }

    public function service(string $slug)
    {
        $catalog = collect([
            'security-guards' => [
                'slug' => 'security-guards',
                'title' => 'Security Guards',
                'icon' => 'Shield',
                'intro' => 'Professional, licensed guards for diverse industries.',
                'features' => ['24/7 coverage', 'Background-checked', 'Ongoing training', 'Digital post orders'],
            ],
            'cctv-surveillance' => [
                'slug' => 'cctv-surveillance',
                'title' => 'CCTV Surveillance',
                'icon' => 'Camera',
                'intro' => 'Live monitoring with instant incident response and forensics.',
                'features' => ['Real-time alerts', 'Cloud recording', 'AI analytics', 'Evidence export'],
            ],
            'mobile-patrol' => [
                'slug' => 'mobile-patrol',
                'title' => 'Mobile Patrol',
                'icon' => 'Car',
                'intro' => 'Visible deterrent with scheduled and randomized patrols.',
                'features' => ['GPS tracked', 'Photo evidence', 'Incident escalation'],
            ],
            'event-security' => [
                'slug' => 'event-security',
                'title' => 'Event Security',
                'icon' => 'Calendar',
                'intro' => 'From small gatherings to large festivals, we keep events safe.',
                'features' => ['Access control', 'Crowd management', 'VIP protection'],
            ],
            'risk-consulting' => [
                'slug' => 'risk-consulting',
                'title' => 'Risk Consulting',
                'icon' => 'Activity',
                'intro' => 'Assess, plan, and harden your security posture.',
                'features' => ['Threat modeling', 'Policy design', 'Compliance'],
            ],
            'integrated-systems' => [
                'slug' => 'integrated-systems',
                'title' => 'Integrated Systems',
                'icon' => 'Cpu',
                'intro' => 'Unified security systems and seamless integrations.',
                'features' => ['Access control', 'Alarms', 'System integrations'],
            ],
        ]);

        if (!$catalog->has($slug)) {
            abort(404);
        }

        return Inertia::render('Public/Services/Service', [
            'service' => $catalog->get($slug),
        ]);
    }

    public function about()
    {
        return Inertia::render('Public/About');
    }

    public function careers()
    {
        $jobs = JobPosting::query()
            ->where('status', 'published')
            ->orderByDesc('posted_at')
            ->orderByDesc('id')
            ->get(['id','title','location','type','posted_at']);

        return Inertia::render('Public/Careers', [
            'jobs' => $jobs,
        ]);
    }

    public function privacy()
    {
        return Inertia::render('Public/Privacy');
    }
}
