<?php

namespace App\Services;

use App\Models\Guards\Guard;
use Carbon\Carbon;

class GuardDuplicateDetectionService
{
    private function normalizeString(?string $value): ?string
    {
        if ($value === null) return null;
        $v = trim($value);
        if ($v === '') return null;
        $v = preg_replace('/\s+/', ' ', $v);
        return $v;
    }

    private function normalizeUpper(?string $value): ?string
    {
        $v = $this->normalizeString($value);
        if ($v === null) return null;
        return mb_strtoupper($v);
    }

    private function normalizeName(?string $value): ?string
    {
        $v = $this->normalizeString($value);
        if ($v === null) return null;
        return mb_strtolower($v);
    }

    private function normalizePhone(?string $value): ?string
    {
        $v = $this->normalizeString($value);
        if ($v === null) return null;
        $digits = preg_replace('/\D+/', '', $v);
        return $digits !== '' ? $digits : null;
    }

    private function normalizeDate(?string $value): ?string
    {
        $v = $this->normalizeString($value);
        if ($v === null) return null;

        try {
            return Carbon::parse($v)->toDateString();
        } catch (\Throwable $e) {
            return null;
        }
    }

    public function detect(array $records): array
    {
        $fileDupReasonsByRow = $this->detectFileDuplicates($records);
        $dbDupReasonsByRow = $this->detectDbDuplicates($records);

        $combined = $fileDupReasonsByRow;
        foreach ($dbDupReasonsByRow as $row => $reasons) {
            foreach ($reasons as $r) {
                $combined[$row][] = $r;
            }
        }

        return [
            'duplicate_rows' => $this->toRowReasonList($combined),
            'file_duplicate_rows' => $this->toRowReasonList($fileDupReasonsByRow),
            'db_duplicate_rows' => $this->toRowReasonList($dbDupReasonsByRow),
        ];
    }

    private function detectFileDuplicates(array $records): array
    {
        $reasonsByRow = [];

        $seen = [
            'employee_id' => [],
            'id_number' => [],
            'phone' => [],
            'name_dob' => [],
        ];

        foreach ($records as $rec) {
            $rowNum = (int) ($rec['row_num'] ?? 0);
            $d = (array) ($rec['data'] ?? []);

            $employeeId = $this->normalizeUpper($d['employee_id'] ?? null);
            $idNumber = $this->normalizeUpper($d['id_number'] ?? null);
            $phone = $this->normalizePhone($d['phone'] ?? null);
            $name = $this->normalizeName($d['name'] ?? null);
            $dob = $this->normalizeDate($d['date_of_birth'] ?? null);
            $nameDob = ($name !== null && $dob !== null) ? ($name . '|' . $dob) : null;

            $this->markIfSeen($seen['employee_id'], $employeeId, $rowNum, $reasonsByRow, 'Duplicate in file (employee_id)');
            $this->markIfSeen($seen['id_number'], $idNumber, $rowNum, $reasonsByRow, 'Duplicate in file (id_number)');
            $this->markIfSeen($seen['phone'], $phone, $rowNum, $reasonsByRow, 'Duplicate in file (phone)');
            $this->markIfSeen($seen['name_dob'], $nameDob, $rowNum, $reasonsByRow, 'Duplicate in file (name + date_of_birth)');
        }

        return $reasonsByRow;
    }

    private function markIfSeen(array &$map, ?string $key, int $rowNum, array &$reasonsByRow, string $reason): void
    {
        if ($key === null) return;

        if (isset($map[$key])) {
            $firstRow = $map[$key];
            $reasonsByRow[$firstRow] = array_values(array_unique(array_merge($reasonsByRow[$firstRow] ?? [], [$reason])));
            $reasonsByRow[$rowNum] = array_values(array_unique(array_merge($reasonsByRow[$rowNum] ?? [], [$reason])));
            return;
        }

        $map[$key] = $rowNum;
    }

    private function detectDbDuplicates(array $records): array
    {
        $reasonsByRow = [];

        $employeeIds = [];
        $idNumbers = [];
        $phones = [];
        $phoneVariants = [];
        $dobs = [];

        foreach ($records as $rec) {
            $d = (array) ($rec['data'] ?? []);

            $employeeId = $this->normalizeUpper($d['employee_id'] ?? null);
            $idNumber = $this->normalizeUpper($d['id_number'] ?? null);
            $phone = $this->normalizePhone($d['phone'] ?? null);
            $dob = $this->normalizeDate($d['date_of_birth'] ?? null);

            if ($employeeId !== null) $employeeIds[$employeeId] = true;
            if ($idNumber !== null) $idNumbers[$idNumber] = true;
            if ($phone !== null) {
                $phones[$phone] = true;
                $phoneVariants[$phone] = true;
                $phoneVariants['+' . $phone] = true;
            }
            if ($dob !== null) $dobs[$dob] = true;
        }

        $query = Guard::query()->select(['id', 'name', 'employee_id', 'id_number', 'phone', 'date_of_birth']);
        $query->where(function ($q) use ($employeeIds, $idNumbers, $phoneVariants, $dobs) {
            $hasAny = false;
            if (!empty($employeeIds)) {
                $q->orWhereIn('employee_id', array_keys($employeeIds));
                $hasAny = true;
            }
            if (!empty($idNumbers)) {
                $q->orWhereIn('id_number', array_keys($idNumbers));
                $hasAny = true;
            }
            if (!empty($phoneVariants)) {
                $q->orWhereIn('phone', array_keys($phoneVariants));
                $hasAny = true;
            }
            if (!empty($dobs)) {
                $q->orWhereIn('date_of_birth', array_keys($dobs));
                $hasAny = true;
            }

            if (!$hasAny) {
                $q->whereRaw('1 = 0');
            }
        });

        $candidates = $query->get();

        $existingEmployeeIds = [];
        $existingIdNumbers = [];
        $existingPhones = [];
        $existingNameDob = [];

        foreach ($candidates as $g) {
            $e = $this->normalizeUpper($g->employee_id);
            $i = $this->normalizeUpper($g->id_number);
            $p = $this->normalizePhone($g->phone);
            $n = $this->normalizeName($g->name);
            $dob = $g->date_of_birth ? Carbon::parse($g->date_of_birth)->toDateString() : null;

            if ($e !== null) $existingEmployeeIds[$e] = true;
            if ($i !== null) $existingIdNumbers[$i] = true;
            if ($p !== null) $existingPhones[$p] = true;
            if ($n !== null && $dob !== null) $existingNameDob[$n . '|' . $dob] = true;
        }

        foreach ($records as $rec) {
            $rowNum = (int) ($rec['row_num'] ?? 0);
            $d = (array) ($rec['data'] ?? []);

            $employeeId = $this->normalizeUpper($d['employee_id'] ?? null);
            $idNumber = $this->normalizeUpper($d['id_number'] ?? null);
            $phone = $this->normalizePhone($d['phone'] ?? null);
            $name = $this->normalizeName($d['name'] ?? null);
            $dob = $this->normalizeDate($d['date_of_birth'] ?? null);
            $nameDob = ($name !== null && $dob !== null) ? ($name . '|' . $dob) : null;

            if ($employeeId !== null && isset($existingEmployeeIds[$employeeId])) {
                $reasonsByRow[$rowNum][] = 'Duplicate in system (employee_id)';
            }
            if ($idNumber !== null && isset($existingIdNumbers[$idNumber])) {
                $reasonsByRow[$rowNum][] = 'Duplicate in system (id_number)';
            }
            if ($phone !== null && isset($existingPhones[$phone])) {
                $reasonsByRow[$rowNum][] = 'Duplicate in system (phone)';
            }
            if ($nameDob !== null && isset($existingNameDob[$nameDob])) {
                $reasonsByRow[$rowNum][] = 'Duplicate in system (name + date_of_birth)';
            }

            if (isset($reasonsByRow[$rowNum])) {
                $reasonsByRow[$rowNum] = array_values(array_unique($reasonsByRow[$rowNum]));
            }
        }

        return $reasonsByRow;
    }

    private function toRowReasonList(array $reasonsByRow): array
    {
        ksort($reasonsByRow);
        $out = [];
        foreach ($reasonsByRow as $row => $reasons) {
            $out[] = ['row_num' => (int) $row, 'reasons' => array_values(array_unique($reasons))];
        }
        return $out;
    }
}
