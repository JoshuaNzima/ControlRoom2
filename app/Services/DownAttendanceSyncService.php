<?php

namespace App\Services;

use App\Models\Down;
use App\Models\Guards\Attendance;
use App\Models\Guards\ClientSite;
use App\Models\Guards\Guard;
use App\Models\Guards\GuardAssignment;
use App\Models\User;
use App\Notifications\GenericDbNotification;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Schema;

class DownAttendanceSyncService
{
	public function syncFromAttendance(Attendance $attendance): void
	{
		$dateString = $attendance->date?->toDateString() ?: (string) $attendance->getRawOriginal('date');
		if (!$dateString) {
			return;
		}

		$today = now()->toDateString();
		if ($dateString !== $today) {
			return;
		}

		$guardId = (int) ($attendance->guard_id ?? 0);
		if (!$guardId) {
			return;
		}

		$siteId = (int) ($attendance->client_site_id ?? 0);
		if (!$siteId) {
			$assignment = GuardAssignment::query()
				->where('guard_id', $guardId)
				->active()
				->current()
				->orderByDesc('id')
				->first();
			$siteId = (int) ($assignment?->client_site_id ?? 0);
		}

		if (!$siteId) {
			return;
		}

		if ($attendance->status === 'absent' && !$attendance->check_in_time) {
			$this->openDownForGuardAbsence(
				$guardId,
				$siteId,
				$attendance->supervisor_id ? (int) $attendance->supervisor_id : null,
				$attendance->check_in_notes,
				$dateString
			);
			return;
		}

		if ($attendance->status === 'present' || $attendance->status === 'late' || $attendance->status === 'covered' || $attendance->check_in_time) {
			$this->resolveDownForGuardAbsence($guardId, $siteId, $attendance->supervisor_id ? (int) $attendance->supervisor_id : null, $dateString);
			$this->resolveOpenDownsForSiteIfCovered($siteId, $attendance->supervisor_id ? (int) $attendance->supervisor_id : null, $dateString);
		}
	}

	public function syncFromDown(Down $down): void
	{
		if ($down->type !== 'guard_absent') {
			return;
		}
		if (!in_array($down->status, ['open', 'escalated'], true)) {
			return;
		}

		$dateString = $down->created_at?->toDateString() ?: now()->toDateString();
		$today = now()->toDateString();
		if ($dateString !== $today) {
			return;
		}

		$guardId = (int) ($down->guard_id ?? 0);
		$siteId = (int) ($down->client_site_id ?? 0);
		if (!$guardId || !$siteId) {
			return;
		}

		$attendance = Attendance::query()
			->where('guard_id', $guardId)
			->whereDate('date', $dateString)
			->orderByDesc('id')
			->first();

		if ($attendance && $attendance->check_in_time) {
			return;
		}

		Attendance::withoutEvents(function () use ($attendance, $down, $guardId, $siteId, $dateString) {
			$notes = trim((string) ($down->description ?? ''));
			$prefix = 'Marked absent from down report.';
			$merged = trim($prefix . ($notes ? ' ' . $notes : ''));

			if ($attendance) {
				$attendance->status = 'absent';
				$attendance->supervisor_id = $down->reported_by;
				if (!$attendance->client_site_id) {
					$attendance->client_site_id = $siteId;
				}
				$attendance->check_in_notes = trim(($attendance->check_in_notes ?: '') . ' ' . $merged);
				$attendance->source = $attendance->source ?: 'down_sync';
				$attendance->save();
				return;
			}

			Attendance::create([
				'guard_id' => $guardId,
				'supervisor_id' => $down->reported_by,
				'client_site_id' => $siteId,
				'date' => $dateString,
				'check_in_time' => null,
				'check_out_time' => null,
				'hours_worked' => 0,
				'overtime_hours' => 0,
				'status' => 'absent',
				'check_in_notes' => $merged,
				'check_out_notes' => null,
				'backdated' => false,
				'backdated_reason' => null,
				'source' => 'down_sync',
			]);
		});
	}

	public function syncFromGuardAssignment(GuardAssignment $assignment): void
	{
		$siteId = (int) ($assignment->client_site_id ?? 0);
		$guardId = (int) ($assignment->guard_id ?? 0);
		if (!$siteId || !$guardId) {
			return;
		}

		$today = now()->toDateString();
		$startDate = $assignment->start_date?->toDateString() ?: (string) $assignment->getRawOriginal('start_date');
		if (!$startDate) {
			$startDate = $today;
		}

		if ($startDate !== $today) {
			return;
		}

		$this->resolveOpenDownsForSiteIfCovered($siteId, $assignment->assigned_by ? (int) $assignment->assigned_by : null, $today, $guardId);
	}

	public function openDownForGuardAbsence(int $guardId, int $siteId, ?int $reportedBy, ?string $notes, string $dateString): void
	{
		$alreadyCovered = Attendance::query()
			->whereDate('date', $dateString)
			->where('client_site_id', $siteId)
			->whereNotNull('check_in_time')
			->exists();
		if ($alreadyCovered) {
			return;
		}

		$site = ClientSite::query()->with(['client:id,name'])->find($siteId);
		if (!$site) {
			return;
		}

		$guard = Guard::find($guardId);
		$systemUserId = User::query()->min('id');
		$reporterId = $reportedBy ?: ($systemUserId ?: 1);

		$existing = Down::query()
			->where('type', 'guard_absent')
			->where('guard_id', $guardId)
			->where('client_site_id', $siteId)
			->whereDate('created_at', $dateString)
			->orderByDesc('id')
			->first();

		$description = trim((string) ($notes ?? ''));
		$title = $guard ? ('Guard absent: ' . $guard->name) : 'Guard absent';

		if ($existing && $existing->status !== 'resolved') {
			return;
		}

		if ($existing && $existing->status === 'resolved') {
			$existing->update([
				'status' => 'open',
				'resolved_at' => null,
				'resolved_by' => null,
				'resolution_notes' => null,
				'description' => $description ?: $existing->description,
			]);
			return;
		}

		$down = Down::create([
			'client_id' => $site->client_id,
			'client_site_id' => $siteId,
			'reported_by' => $reporterId,
			'guard_id' => $guardId,
			'type' => 'guard_absent',
			'title' => $title,
			'description' => $description ?: 'Guard marked absent.',
			'status' => 'open',
			'escalation_level' => 0,
		]);

		unset($down);
	}

	public function resolveDownForGuardAbsence(int $guardId, int $siteId, ?int $resolvedBy, string $dateString): void
	{
		$record = Down::query()
			->where('type', 'guard_absent')
			->where('guard_id', $guardId)
			->where('client_site_id', $siteId)
			->whereDate('created_at', $dateString)
			->whereIn('status', ['open', 'escalated'])
			->orderByDesc('id')
			->first();

		if (!$record) {
			return;
		}

		$systemUserId = User::query()->min('id');
		$record->status = 'resolved';
		$record->resolved_at = now();
		$record->resolved_by = $resolvedBy ?: ($systemUserId ?: null);
		$record->resolution_notes = $record->resolution_notes ?: 'Auto-resolved based on attendance update.';
		$record->save();
	}

	public function resolveOpenDownsForSiteIfCovered(int $siteId, ?int $resolvedBy, string $dateString, ?int $coverGuardId = null): void
	{
		$downs = Down::query()
			->where('client_site_id', $siteId)
			->whereDate('created_at', $dateString)
			->whereIn('type', ['guard_absent', 'site_unmanned'])
			->whereIn('status', ['open', 'escalated'])
			->get();

		if ($downs->isEmpty()) {
			return;
		}

		$systemUserId = User::query()->min('id');

		foreach ($downs as $down) {
			if ($coverGuardId && (int) ($down->guard_id ?? 0) === $coverGuardId) {
				continue;
			}

			$down->status = 'resolved';
			$down->resolved_at = now();
			$down->resolved_by = $resolvedBy ?: ($systemUserId ?: null);
			$down->resolution_notes = $down->resolution_notes ?: 'Auto-resolved: site covered.';
			$down->save();
		}
	}

	public function notifyZoneCommanderDownOpened(Down $down): void
	{
		if (!Schema::hasTable('notifications')) {
			return;
		}

		$site = $down->clientSite;
		if (!$site) {
			$site = ClientSite::find($down->client_site_id);
		}
		if (!$site) {
			return;
		}

		$zoneId = (int) ($site->zone_id ?? 0);
		if (!$zoneId) {
			return;
		}

		$targets = User::role('zone_commander')
			->where('zone_id', $zoneId)
			->where('status', 'active')
			->get();

		if ($targets->isEmpty()) {
			return;
		}

		$title = 'Down: ' . ($down->type === 'guard_absent' ? 'Guard absent' : 'Site issue');
		$msg = $down->title;
		$url = route('zone.downs.index');

		Notification::send($targets, new GenericDbNotification([
			'title' => $title,
			'message' => $msg,
			'url' => $url,
			'down_id' => $down->id,
			'client_site_id' => $down->client_site_id,
			'guard_id' => $down->guard_id,
		]));
	}
}
