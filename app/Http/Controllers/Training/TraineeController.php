<?php

namespace App\Http\Controllers\Training;

use App\Http\Controllers\Controller;
use App\Models\Training\Trainee;
use App\Models\Training\TraineeTrainer;
use App\Models\Training\Regimen;
use App\Models\Guards\{Guard, GuardAssignment, ClientSite};
use App\Models\Guards\Client;
use App\Models\Zone;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class TraineeController extends Controller
{
    public function index(Request $request)
    {
        $q = trim((string) $request->query('q', ''));
        $status = (string) $request->query('status', '');
        $track = (string) $request->query('track', '');
        $perPage = (int) $request->query('per_page', 20);
        $perPage = max(5, min($perPage, 100));

        $trainees = Trainee::query()
            ->with(['primaryTrainer:id,name', 'regimen:id,title,track'])
            ->when($q !== '', function ($qq) use ($q) {
                $qq->where(function ($w) use ($q) {
                    $w->where('name', 'like', "%{$q}%")
                        ->orWhere('phone', 'like', "%{$q}%")
                        ->orWhere('id_number', 'like', "%{$q}%");
                });
            })
            ->when($status !== '', fn ($qq) => $qq->where('status', $status))
            ->when(in_array($track, ['standard', 'rapid_response'], true), fn ($qq) => $qq->where('training_track', $track))
            ->orderByDesc('created_at')
            ->paginate($perPage)
            ->withQueryString()
            ->through(function (Trainee $t) {
                return [
                    'id' => $t->id,
                    'name' => $t->name,
                    'phone' => $t->phone,
                    'status' => $t->status,
                    'training_track' => $t->training_track,
                    'training_days' => $t->training_days,
                    'training_start_date' => optional($t->training_start_date)->toDateString(),
                    'training_end_date' => optional($t->training_end_date)->toDateString(),
                    'regimen' => $t->regimen ? ['id' => $t->regimen->id, 'title' => $t->regimen->title, 'track' => $t->regimen->track] : null,
                    'primary_trainer' => $t->primaryTrainer ? ['id' => $t->primaryTrainer->id, 'name' => $t->primaryTrainer->name] : null,
                    'converted_guard_id' => $t->converted_guard_id,
                ];
            });

        $trainers = User::query()
            ->where('status', 'active')
            ->whereHas('roles', fn ($q) => $q->whereIn('name', ['trainer', 'super_admin']))
            ->orderBy('name')
            ->get(['id', 'name']);

        $regimens = Regimen::query()->orderBy('title')->get(['id', 'title', 'track', 'default_days']);

        $zones = Zone::orderBy('name')->get(['id', 'name']);
        $clients = Client::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Training/Trainees/Index', [
            'trainees' => $trainees,
            'filters' => $request->only(['q', 'status', 'track', 'per_page']),
            'trainers' => $trainers,
            'regimens' => $regimens,
            'zones' => $zones,
            'clients' => $clients,
            'minTrainingDays' => 5,
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'id_number' => ['nullable', 'string', 'max:100'],
            'date_of_birth' => ['nullable', 'date'],
            'gender' => ['nullable', 'in:male,female,other'],
            'notes' => ['nullable', 'string'],
            'training_track' => ['nullable', 'in:standard,rapid_response'],
            'training_days' => ['nullable', 'integer', 'min:5', 'max:365'],
            'regimen_id' => ['nullable', 'exists:training_regimens,id'],
            'primary_trainer_id' => ['nullable', 'exists:users,id'],
            'trainer_ids' => ['nullable', 'array'],
            'trainer_ids.*' => ['integer', 'exists:users,id'],
        ]);

        $primaryTrainerId = (int) ($data['primary_trainer_id'] ?? 0);
        $trainerIds = array_values(array_unique(array_map('intval', (array) ($data['trainer_ids'] ?? []))));

        if ($primaryTrainerId <= 0 && $user && $user->hasRole('trainer')) {
            $primaryTrainerId = (int) $user->id;
        }

        if ($primaryTrainerId > 0 && !in_array($primaryTrainerId, $trainerIds, true)) {
            $trainerIds[] = $primaryTrainerId;
        }

        if ($primaryTrainerId <= 0) {
            return back()->withError('Primary trainer is required.');
        }

        $trainingDays = (int) ($data['training_days'] ?? 5);
        $trainingDays = max(5, $trainingDays);

        $trainee = Trainee::create([
            'name' => $data['name'],
            'phone' => $data['phone'] ?? null,
            'email' => $data['email'] ?? null,
            'address' => $data['address'] ?? null,
            'id_number' => $data['id_number'] ?? null,
            'date_of_birth' => $data['date_of_birth'] ?? null,
            'gender' => $data['gender'] ?? null,
            'notes' => $data['notes'] ?? null,
            'training_track' => $data['training_track'] ?? 'standard',
            'training_days' => $trainingDays,
            'regimen_id' => $data['regimen_id'] ?? null,
            'primary_trainer_id' => $primaryTrainerId,
            'status' => 'pending_assignment',
            'created_by' => $user?->id,
        ]);

        $this->syncTrainers($trainee, $trainerIds, $primaryTrainerId, $user?->id);

        // If created with a trainer already, transition into in_training
        $trainee->status = 'in_training';
        $trainee->save();

        return back()->withSuccess('Trainee created.');
    }

    public function showJson(Request $request, Trainee $trainee)
    {
        $trainee->load(['trainers:id,name', 'regimen:id,title,track,default_days', 'primaryTrainer:id,name']);

        return response()->json([
            'id' => $trainee->id,
            'name' => $trainee->name,
            'phone' => $trainee->phone,
            'email' => $trainee->email,
            'address' => $trainee->address,
            'id_number' => $trainee->id_number,
            'date_of_birth' => optional($trainee->date_of_birth)->toDateString(),
            'gender' => $trainee->gender,
            'notes' => $trainee->notes,
            'training_track' => $trainee->training_track,
            'training_days' => $trainee->training_days,
            'training_start_date' => optional($trainee->training_start_date)->toDateString(),
            'training_end_date' => optional($trainee->training_end_date)->toDateString(),
            'status' => $trainee->status,
            'regimen' => $trainee->regimen ? ['id' => $trainee->regimen->id, 'title' => $trainee->regimen->title] : null,
            'trainers' => $trainee->trainers->map(fn ($u) => ['id' => $u->id, 'name' => $u->name]),
            'primary_trainer' => $trainee->primaryTrainer ? ['id' => $trainee->primaryTrainer->id, 'name' => $trainee->primaryTrainer->name] : null,
            'converted_guard_id' => $trainee->converted_guard_id,
        ]);
    }

    public function updateTrainers(Request $request, Trainee $trainee)
    {
        $user = $request->user();

        $data = $request->validate([
            'primary_trainer_id' => ['required', 'exists:users,id'],
            'trainer_ids' => ['required', 'array', 'min:1'],
            'trainer_ids.*' => ['integer', 'exists:users,id'],
        ]);

        $primaryTrainerId = (int) $data['primary_trainer_id'];
        $trainerIds = array_values(array_unique(array_map('intval', (array) $data['trainer_ids'])));
        if (!in_array($primaryTrainerId, $trainerIds, true)) {
            $trainerIds[] = $primaryTrainerId;
        }

        $this->syncTrainers($trainee, $trainerIds, $primaryTrainerId, $user?->id);

        if ($trainee->status === 'pending_assignment') {
            $trainee->status = 'in_training';
            $trainee->save();
        }

        return back()->withSuccess('Trainers updated.');
    }

    public function startTraining(Request $request, Trainee $trainee)
    {
        if ($trainee->status === 'approved' || $trainee->status === 'rejected') {
            return back()->withError('Cannot start training after a decision.');
        }

        $data = $request->validate([
            'training_start_date' => ['nullable', 'date'],
            'training_days' => ['nullable', 'integer', 'min:5', 'max:365'],
        ]);

        $start = isset($data['training_start_date']) ? Carbon::parse($data['training_start_date'])->startOfDay() : Carbon::now()->startOfDay();
        $days = (int) ($data['training_days'] ?? $trainee->training_days ?? 5);
        $days = max(5, $days);

        $trainee->training_days = $days;
        $trainee->training_start_date = $start;
        $trainee->training_end_date = (clone $start)->addDays($days);
        $trainee->status = 'in_training';
        $trainee->save();

        return back()->withSuccess('Training started.');
    }

    public function approve(Request $request, Trainee $trainee)
    {
        $user = $request->user();
        if (!$this->canDecide($user, $trainee)) {
            abort(403, 'Only the primary trainer can approve/reject this trainee.');
        }

        if ($trainee->status === 'approved' || $trainee->status === 'rejected') {
            return back()->withError('Decision already made.');
        }

        if (!$this->trainingPeriodComplete($user, $trainee)) {
            return back()->withError('Training period has not completed yet.');
        }

        $data = $request->validate([
            'decision_notes' => ['nullable', 'string'],
            'guard_status' => ['nullable', 'in:active,inactive,suspended'],
            'zone_id' => ['nullable', 'integer', 'exists:zones,id'],
            'client_id' => ['nullable', 'integer', 'exists:clients,id'],
        ]);

        $guardStatus = (string) ($data['guard_status'] ?? 'inactive');

        DB::transaction(function () use ($trainee, $user, $data, $guardStatus) {
            $idNumber = $trainee->id_number;
            if (!empty($idNumber) && Guard::where('id_number', $idNumber)->exists()) {
                $idNumber = null;
            }

            $guard = Guard::create([
                'name' => $trainee->name,
                'phone' => $trainee->phone,
                'email' => $trainee->email,
                'address' => $trainee->address,
                'id_number' => $idNumber,
                'date_of_birth' => $trainee->date_of_birth,
                'gender' => $trainee->gender,
                'hire_date' => now()->toDateString(),
                'status' => $guardStatus,
                'employee_role' => 'guard',
                'notes' => $trainee->notes,
                'zone_id' => $this->canAssignGuard($user) ? ($data['zone_id'] ?? null) : null,
            ]);

            if ($this->canAssignGuard($user) && !empty($data['client_id'])) {
                $site = ClientSite::query()
                    ->where('client_id', (int) $data['client_id'])
                    ->orderBy('id')
                    ->first();

                if ($site) {
                    GuardAssignment::create([
                        'guard_id' => $guard->id,
                        'client_site_id' => $site->id,
                        'assigned_by' => $user?->id,
                        'start_date' => now()->toDateString(),
                        'end_date' => null,
                        'assignment_type' => 'permanent',
                        'notes' => 'Assigned during trainee approval',
                        'active' => true,
                        'is_active' => true,
                    ]);
                }
            }

            $trainee->status = 'approved';
            $trainee->decided_at = now();
            $trainee->decided_by = $user?->id;
            $trainee->decision_notes = $data['decision_notes'] ?? null;
            $trainee->converted_guard_id = $guard->id;
            $trainee->save();
        });

        return back()->withSuccess('Trainee approved and transferred to guards.');
    }

    public function reject(Request $request, Trainee $trainee)
    {
        $user = $request->user();
        if (!$this->canDecide($user, $trainee)) {
            abort(403, 'Only the primary trainer can approve/reject this trainee.');
        }

        if ($trainee->status === 'approved' || $trainee->status === 'rejected') {
            return back()->withError('Decision already made.');
        }

        if (!$this->trainingPeriodComplete($user, $trainee)) {
            return back()->withError('Training period has not completed yet.');
        }

        $data = $request->validate([
            'decision_notes' => ['nullable', 'string'],
        ]);

        $trainee->status = 'rejected';
        $trainee->decided_at = now();
        $trainee->decided_by = $user?->id;
        $trainee->decision_notes = $data['decision_notes'] ?? null;
        $trainee->save();

        return back()->withSuccess('Trainee rejected.');
    }

    private function syncTrainers(Trainee $trainee, array $trainerIds, int $primaryTrainerId, ?int $actorId): void
    {
        $trainerIds = array_values(array_unique(array_filter(array_map('intval', $trainerIds))));
        if (!in_array($primaryTrainerId, $trainerIds, true)) {
            $trainerIds[] = $primaryTrainerId;
        }

        $sync = [];
        foreach ($trainerIds as $id) {
            $sync[$id] = [
                'is_primary' => (int) $id === (int) $primaryTrainerId,
                'assigned_by' => $actorId,
            ];
        }

        $trainee->trainers()->sync($sync);

        if ((int) ($trainee->primary_trainer_id ?? 0) !== (int) $primaryTrainerId) {
            $trainee->primary_trainer_id = $primaryTrainerId;
            $trainee->save();
        }
    }

    private function canDecide($user, Trainee $trainee): bool
    {
        if (!$user) return false;
        if ($user->hasRole('super_admin')) return true;

        return $trainee->trainers()
            ->where('users.id', $user->id)
            ->whereRaw('training_trainee_trainers.is_primary = ?', [true])
            ->exists();
    }

    private function trainingPeriodComplete($user, Trainee $trainee): bool
    {
        if ($user && $user->hasRole('super_admin')) return true;

        if (!$trainee->training_start_date) return false;

        $end = $trainee->training_end_date;
        if ($end) {
            return Carbon::now()->startOfDay()->greaterThanOrEqualTo(Carbon::parse($end)->startOfDay());
        }

        $days = max(5, (int) ($trainee->training_days ?? 5));
        return Carbon::parse($trainee->training_start_date)->addDays($days)->startOfDay()->lte(Carbon::now()->startOfDay());
    }

    private function canAssignGuard($user): bool
    {
        if (!$user) return false;
        if ($user->hasRole('super_admin')) return true;
        if ($user->can('guards.assign')) return true;
        return $user->hasAnyRole(['admin', 'manager', 'operations_officer', 'hr', 'human_resources']);
    }
}
