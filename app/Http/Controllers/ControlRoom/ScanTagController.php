<?php

namespace App\Http\Controllers\ControlRoom;

use App\Http\Controllers\Controller;
use App\Models\ScanTag;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ScanTagController extends Controller
{
    public function index(Request $request)
    {
        $query = ScanTag::with(['checkpointScan.checkpoint.clientSite.client', 'checkpointScan.supervisor']);

        if ($site = $request->get('site')) {
            $query->whereJsonContains('tags->site_id', (int) $site);
        }

        if ($supervisor = $request->get('supervisor')) {
            $query->whereJsonContains('tags->supervisor_id', (int) $supervisor);
        }

        if ($quality = $request->get('location_quality')) {
            $query->whereJsonContains('tags->location_quality', $quality);
        }

        $tags = $query->orderBy('created_at', 'desc')->paginate(20)->withQueryString();

        return Inertia::render('ControlRoom/ScanTags', [
            'tags' => $tags,
            'filters' => $request->only(['site', 'supervisor', 'location_quality']),
        ]);
    }
}
