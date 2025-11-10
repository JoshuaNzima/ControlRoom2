<?php

namespace App\Observers;

use App\Models\Guards\Guard;

class GuardObserver
{
    public function creating(Guard $guard)
    {
        if (empty($guard->employee_id)) {
            $guard->employee_id = $this->generateEmployeeId();
        }
    }

    protected function generateEmployeeId(): string
    {
        $prefix = 'G';
        $year = date('y');
        
        // Get the latest guard number
        $lastGuard = Guard::withTrashed()
            ->where('employee_id', 'like', "{$prefix}{$year}%")
            ->orderByDesc('employee_id')
            ->first();

        if ($lastGuard) {
            // Extract the numeric part and increment
            $lastNumber = (int) substr($lastGuard->employee_id, -4);
            $nextNumber = $lastNumber + 1;
        } else {
            $nextNumber = 1;
        }

        // Format: G23XXXX (G for Guard, 23 for year, XXXX for sequential number)
        return sprintf("%s%s%04d", $prefix, $year, $nextNumber);
    }
}