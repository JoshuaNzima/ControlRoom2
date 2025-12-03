<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use App\Models\Guards\Guard;
use App\Models\Guards\ClientSite;
use App\Models\Guards\Client;
use Illuminate\Support\Facades\File;

class LandingController extends Controller
{
    public function index()
    {
        $metrics = [
            'guards_total' => Guard::count(),
            'sites_total' => ClientSite::where('status', 'active')->count(),
            'clients_total' => Client::count(),
            'uptime_pct' => 99.8,
        ];

        $teamImages = [];
        $teamDir = public_path('images/team');
        if (File::exists($teamDir)) {
            foreach (File::files($teamDir) as $file) {
                $ext = strtolower($file->getExtension());
                if (in_array($ext, ['jpg','jpeg','png','webp'])) {
                    $teamImages[] = '/images/team/'.$file->getFilename();
                }
            }
        }
        if (empty($teamImages)) {
            foreach (['milosz-klinowski-BW0d0IllW8E-unsplash.jpg','pawel-czerwinski-OfwiURcZwYw-unsplash.jpg'] as $fallback) {
                if (File::exists(public_path('images/'.$fallback))) {
                    $teamImages[] = '/images/'.$fallback;
                }
            }
        }

        return Inertia::render('Public/Home', [
            'metrics' => $metrics,
            'team' => $teamImages,
        ]);
    }
}
