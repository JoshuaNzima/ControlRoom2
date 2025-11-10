<?php

namespace App\Http\Controllers\Operations\ControlRoom;

use App\Http\Controllers\Controller;
use App\Models\Zone;
use App\Models\Guards\Guard;
use App\Models\ClientSite;
use App\Models\Camera;
use App\Models\Guards\DownReport;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class OperationsOfficerController extends Controller
{
    public function __construct()
    {
        // Keep legacy middleware for backward compatibility
        $this->middleware(\App\Http\Middleware\OperationsOfficerAccess::class);
    }

    /**
     * Legacy wrapper: redirect to the consolidated operations officer dashboard
     */
    public function index()
    {
        return redirect()->route('control-room.operations.officer.dashboard');
    }
}