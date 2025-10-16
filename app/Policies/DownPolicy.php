<?php

namespace App\Policies;

use App\Models\Down;
use App\Models\User;

class DownPolicy
{
	public function viewAny(User $user): bool
	{
		return $user->hasRole('zone_commander');
	}

	public function create(User $user): bool
	{
		return $user->hasRole('zone_commander');
	}

	public function escalate(User $user, Down $down): bool
	{
		return $user->hasRole('zone_commander') && optional($down->clientSite)->zone_id === $user->zone_id;
	}

	public function resolve(User $user, Down $down): bool
	{
		return $user->hasRole('zone_commander') && optional($down->clientSite)->zone_id === $user->zone_id;
	}
}
