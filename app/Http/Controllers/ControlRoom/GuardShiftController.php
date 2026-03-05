<?php

namespace App\Http\Controllers\ControlRoom;

use App\Http\Controllers\Controller;
use App\Models\Guards\Guard;
use App\Models\Guards\Shift;
use Illuminate\Http\Request;

class GuardShiftController extends Controller
{
    protected function scopedShiftQuery(Request $request)
    {
        $user = $request->user();
        $isZoneCommander = $user && method_exists($user, 'hasRole') ? $user->hasRole('zone_commander') : false;
        $isGuardManager = $user && method_exists($user, 'hasAnyRole') ? $user->hasAnyRole(['supervisor', 'sergeant']) : false;

        return Shift::query()
            ->with(['guardRelation', 'clientSite', 'assignedBy', 'attendance'])
            ->when($isGuardManager, function ($q) use ($user) {
                $q->whereHas('guardRelation', fn ($g) => $g->where('supervisor_id', $user->id));
            })
            ->when($isZoneCommander, function ($q) use ($user) {
                $q->whereHas('clientSite', fn ($s) => $s->where('zone_id', $user->zone_id));
            });
    }

    protected function isGuardInScope(Request $request, int $guardId): bool
    {
        $user = $request->user();
        $isZoneCommander = $user && method_exists($user, 'hasRole') ? $user->hasRole('zone_commander') : false;
        $isGuardManager = $user && method_exists($user, 'hasAnyRole') ? $user->hasAnyRole(['supervisor', 'sergeant']) : false;

        return Guard::query()
            ->where('id', $guardId)
            ->where('status', 'active')
            ->when($isGuardManager, fn ($q) => $q->where('supervisor_id', $user->id))
            ->when($isZoneCommander, fn ($q) => $q->where('zone_id', $user->zone_id))
            ->exists();
    }

    public function show(Request $request, Shift $shift)
    {
        $shift = $this->scopedShiftQuery($request)->whereKey($shift->id)->firstOrFail();

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'shift' => $shift,
            ]);
        }

        return redirect()->route('control-room.shifts.index', ['guard_shift' => $shift->id]);
    }

    public function update(Request $request, Shift $shift)
    {
        $shift = $this->scopedShiftQuery($request)->whereKey($shift->id)->firstOrFail();

        if (in_array($shift->status, ['in_progress', 'completed'], true)) {
            return back()->withErrors(['shift' => 'This shift is locked and cannot be edited.']);
        }

        $data = $request->validate([
            'guard_id' => ['required', 'integer', 'exists:guards,id'],
            'client_site_id' => ['required', 'integer', 'exists:client_sites,id'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        if (!$this->isGuardInScope($request, (int) $data['guard_id'])) {
            return back()->withErrors(['guard_id' => 'Selected guard is not allowed for your scope.']);
        }

        $shift->update([
            'guard_id' => (int) $data['guard_id'],
            'client_site_id' => (int) $data['client_site_id'],
            'notes' => $data['notes'] ?? null,
        ]);

        return back()->with('success', 'Guard shift updated.');
    }

    public function cancel(Request $request, Shift $shift)
    {
        $shift = $this->scopedShiftQuery($request)->whereKey($shift->id)->firstOrFail();

        if (in_array($shift->status, ['in_progress', 'completed'], true)) {
            return back()->withErrors(['shift' => 'This shift is locked and cannot be cancelled.']);
        }

        $data = $request->validate([
            'reason' => ['required', 'string', 'max:2000'],
        ]);

        $ok = $shift->cancel($data['reason']);
        if (!$ok) {
            return back()->withErrors(['shift' => 'You are not allowed to cancel this shift.']);
        }

        return back()->with('success', 'Shift cancelled.');
    }

    public function bulk(Request $request)
    {
        $data = $request->validate([
            'shift_ids' => ['required', 'array', 'min:1'],
            'shift_ids.*' => ['integer', 'exists:shifts,id'],
            'action' => ['required', 'in:cancel,reassign_guard,reassign_site'],
            'reason' => ['nullable', 'string', 'max:2000'],
            'guard_id' => ['nullable', 'integer', 'exists:guards,id'],
            'client_site_id' => ['nullable', 'integer', 'exists:client_sites,id'],
        ]);

        if ($data['action'] === 'reassign_guard' && !empty($data['guard_id'])) {
            if (!$this->isGuardInScope($request, (int) $data['guard_id'])) {
                return back()->withErrors(['guard_id' => 'Selected guard is not allowed for your scope.']);
            }
        }

        $shifts = $this->scopedShiftQuery($request)
            ->whereIn('id', $data['shift_ids'])
            ->get();

        $updated = 0;
        $skipped = 0;

        foreach ($shifts as $shift) {
            if (in_array($shift->status, ['in_progress', 'completed'], true)) {
                $skipped++;
                continue;
            }

            if ($data['action'] === 'cancel') {
                $reason = (string) ($data['reason'] ?? '');
                if ($reason === '') {
                    $skipped++;
                    continue;
                }
                if ($shift->cancel($reason)) {
                    $updated++;
                } else {
                    $skipped++;
                }
                continue;
            }

            if ($data['action'] === 'reassign_guard') {
                if (empty($data['guard_id'])) {
                    $skipped++;
                    continue;
                }
                $shift->guard_id = (int) $data['guard_id'];
                $shift->save();
                $updated++;
                continue;
            }

            if ($data['action'] === 'reassign_site') {
                if (empty($data['client_site_id'])) {
                    $skipped++;
                    continue;
                }
                $shift->client_site_id = (int) $data['client_site_id'];
                $shift->save();
                $updated++;
                continue;
            }
        }

        return back()->with('success', "Bulk action complete: {$updated} updated, {$skipped} skipped.");
    }
}
