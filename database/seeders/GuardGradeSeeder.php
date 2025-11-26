<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Guards\GuardGrade;

class GuardGradeSeeder extends Seeder
{
    public function run(): void
    {
        $grades = [
            [
                'code' => 'STD',
                'name' => 'Standard Guard',
                'description' => 'Baseline guard grade',
                'base_salary' => 75000,
                'overtime_multiplier' => 1.50,
                'allowances' => [
                    ['name' => 'transport', 'amount' => 0],
                ],
                'absence_deduction_per_day' => 0,
            ],
            [
                'code' => 'EXEC',
                'name' => 'Executive Guard',
                'description' => 'Executive/VIP guard grade',
                'base_salary' => 150000,
                'overtime_multiplier' => 1.75,
                'allowances' => [
                    ['name' => 'transport', 'amount' => 0],
                    ['name' => 'risk', 'amount' => 0],
                ],
                'absence_deduction_per_day' => 10000,
            ],
        ];

        foreach ($grades as $g) {
            GuardGrade::updateOrCreate(['code' => $g['code']], $g);
        }
    }
}
