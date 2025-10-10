<?php

namespace App\Http\Controllers\Guards;

use App\Http\Controllers\Controller;
use App\Models\Guards\DownReport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DownReportController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'client_site_id' => 'required|exists:client_sites,id',
            'checkpoint_id' => 'nullable|exists:checkpoints,id',
            'reason' => 'nullable|string',
            'photo' => 'nullable|image|max:5120',
        ]);

        if ($request->hasFile('photo')) {
            $validated['photo'] = $request->file('photo')->store('downs/'.now()->format('Y-m-d'), 'public');
        }

        $validated['supervisor_id'] = Auth::id();

        DownReport::create($validated);

        return back()->with('success', 'Down report submitted.');
    }
}


