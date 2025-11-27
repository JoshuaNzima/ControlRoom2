<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Visitor;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class VisitorController extends Controller
{
    public function index(Request $request)
    {
        $query = Visitor::query();

        if ($status = $request->string('status')->toString()) {
            $query->where('status', $status);
        }
        if ($search = $request->string('search')->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('company', 'like', "%{$search}%")
                  ->orWhere('badge_number', 'like', "%{$search}%");
            });
        }

        $visitors = $query->orderByDesc('created_at')->paginate(15)->withQueryString();
        $user = auth()->user();

        return Inertia::render('Admin/FrontDeskVisitors', [
            'visitors' => $visitors,
            'filters' => [
                'status' => $status,
                'search' => $search,
            ],
            'options' => [
                'statuses' => Visitor::STATUSES,
                'users' => User::orderBy('name')->get(['id','name']),
            ],
            'auth' => [
                'user' => [
                    'name' => $user?->name,
                ],
            ],
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);
        $data['created_by'] = auth()->id();
        if (!isset($data['status']) || $data['status'] === 'checked_in') {
            $data['check_in_at'] = now();
            $data['status'] = 'checked_in';
        }
        Visitor::create($data);
        return redirect()->route('admin.front-desk.visitors.index');
    }

    public function update(Request $request, Visitor $visitor)
    {
        $data = $this->validateData($request, true);
        if (($data['status'] ?? null) === 'checked_out' && !$visitor->check_out_at) {
            $data['check_out_at'] = now();
        }
        $visitor->update($data);
        return redirect()->route('admin.front-desk.visitors.index');
    }

    public function destroy(Visitor $visitor)
    {
        $visitor->delete();
        return redirect()->route('admin.front-desk.visitors.index');
    }

    public function showJson(Visitor $visitor)
    {
        return response()->json($visitor);
    }

    protected function validateData(Request $request, bool $update = false): array
    {
        return $request->validate([
            'name' => ['required','string','max:150'],
            'company' => ['nullable','string','max:150'],
            'purpose' => ['nullable','string','max:255'],
            'contact_person' => ['nullable','string','max:150'],
            'badge_number' => ['nullable','string','max:50'],
            'status' => ['nullable','in:' . implode(',', Visitor::STATUSES)],
        ]);
    }
}
