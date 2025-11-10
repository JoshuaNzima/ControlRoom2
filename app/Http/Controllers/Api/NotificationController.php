<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Incident;
use App\Models\Flag;
use App\Models\Down;
use Illuminate\Http\JsonResponse;

class NotificationController extends Controller
{
    public function counts(): JsonResponse
    {
        $user = auth()->user();
        
        // Get counts based on user's role and permissions
        $counts = [
            'incidents' => Incident::where('status', 'open')->count(),
            'flags' => Flag::where('status', 'active')->count(),
            'downs' => Down::whereIn('status', ['open', 'escalated'])->count(),
        ];

        return response()->json($counts);
    }
}