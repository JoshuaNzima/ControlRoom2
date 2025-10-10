<?php

namespace App\Http\Controllers\Web;

use App\Models\Guard;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class GuardController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
           return Inertia::render('Guards/Index', [
            'guards' => Guard::query()
                ->when(request('search'), function ($query, $search) {
                    $query->where('name', 'like', "%{$search}%")
                          ->orWhere('employee_id', 'like', "%{$search}%");
                })
                ->when(request('status'), function ($query, $status) {
                    $query->where('status', $status);
                })
                ->with(['todayAttendance'])
                ->orderBy('name')
                ->paginate(20)
                ->withQueryString(),
            'filters' => request()->only(['search', 'status']),
            'stats' => [
                'total' => Guard::count(),
                'active' => Guard::where('status', 'active')->count(),
                'on_duty' => Guard::whereHas('todayAttendance', function ($q) {
                    $q->whereNotNull('check_in_time')->whereNull('check_out_time');
                })->count(),
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Guards/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
         $validated = $request->validate([
            'name' => 'required|string|max:255',
            'employee_id' => 'required|string|unique:guards,employee_id',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|unique:guards,email',
            'hire_date' => 'required|date',
            'address' => 'nullable|string',
            'id_number' => 'nullable|string|unique:guards,id_number',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:20',
            'notes' => 'nullable|string',
        ]);

        Guard::create($validated);

        return redirect()->route('guards.index')
                       ->with('success', 'Guard added successfully.');
    
    }

    /**
     * Display the specified resource.
     */
    public function show(Guard $guard)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Guard $guard)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Guard $guard)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Guard $guard)
    {
        //
    }
}
