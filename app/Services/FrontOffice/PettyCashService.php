<?php

namespace App\Services\FrontOffice;

use App\Models\Expense;
use App\Models\FrontOffice\OfficeDuty;
use App\Models\FrontOffice\PersonalDuty;
use Illuminate\Support\Facades\DB;

class PettyCashService
{
    /**
     * Process petty cash from an office duty and create Finance expense
     */
    public function processOfficePettyCash(OfficeDuty $duty): ?Expense
    {
        if (empty($duty->petty_cash_amount) || $duty->petty_cash_amount <= 0) {
            return null;
        }

        // Check if expense already exists
        if ($duty->expense_id) {
            return $duty->expense;
        }

        return DB::transaction(function () use ($duty) {
            $expense = Expense::create([
                'amount' => $duty->petty_cash_amount,
                'category' => 'petty_cash',
                'description' => $this->buildOfficeDescription($duty),
                'expense_date' => now(),
                'user_id' => $duty->user_id,
                'status' => 'pending',
                'approval_stage' => 'pending_admin',
                'notes' => $this->buildOfficeNotes($duty),
            ]);

            $duty->update([
                'expense_id' => $expense->id,
            ]);

            return $expense;
        });
    }

    /**
     * Process expense from a personal errand duty
     */
    public function processPersonalExpense(PersonalDuty $duty): ?Expense
    {
        if (empty($duty->actual_amount) || $duty->actual_amount <= 0) {
            return null;
        }

        // Check if expense already exists
        if ($duty->expense_id) {
            return $duty->expense;
        }

        return DB::transaction(function () use ($duty) {
            $expense = Expense::create([
                'amount' => $duty->actual_amount,
                'category' => 'personal_expense',
                'description' => $this->buildPersonalDescription($duty),
                'expense_date' => $duty->completed_at ?? now(),
                'user_id' => $duty->user_id,
                'status' => 'pending',
                'approval_stage' => 'pending_admin',
                'notes' => $this->buildPersonalNotes($duty),
            ]);

            $duty->update([
                'expense_id' => $expense->id,
            ]);

            return $expense;
        });
    }

    /**
     * Update expense when duty amounts change
     */
    public function updateExpenseFromDuty($duty): ?Expense
    {
        if (!$duty->expense_id) {
            return null;
        }

        $expense = $duty->expense;
        if (!$expense) {
            return null;
        }

        $newAmount = $duty instanceof OfficeDuty
            ? $duty->petty_cash_amount
            : $duty->actual_amount;

        if ($newAmount !== $expense->amount) {
            $expense->update([
                'amount' => $newAmount,
                'notes' => $expense->notes . "\n[Updated on " . now()->format('Y-m-d H:i') . "]",
            ]);
        }

        return $expense;
    }

    /**
     * Get total petty cash for a user in a date range
     */
    public function getUserPettyCashTotal(int $userId, ?string $startDate = null, ?string $endDate = null): float
    {
        $query = OfficeDuty::where('user_id', $userId)
            ->whereNotNull('petty_cash_amount')
            ->where('petty_cash_amount', '>', 0);

        if ($startDate && $endDate) {
            $query->whereBetween('created_at', [$startDate, $endDate]);
        }

        return $query->sum('petty_cash_amount') ?? 0;
    }

    /**
     * Get total personal expenses for a user
     */
    public function getUserPersonalExpensesTotal(int $userId, ?string $startDate = null, ?string $endDate = null): float
    {
        $query = PersonalDuty::where('user_id', $userId)
            ->whereNotNull('actual_amount')
            ->where('actual_amount', '>', 0);

        if ($startDate && $endDate) {
            $query->whereBetween('created_at', [$startDate, $endDate]);
        }

        return $query->sum('actual_amount') ?? 0;
    }

    /**
     * Build description for office petty cash expense
     */
    private function buildOfficeDescription(OfficeDuty $duty): string
    {
        $type = $duty->getDutyTypeLabel();
        return "Petty Cash - {$type}: {$duty->title}";
    }

    /**
     * Build notes for office petty cash expense
     */
    private function buildOfficeNotes(OfficeDuty $duty): string
    {
        $notes = [
            "Office Duty ID: {$duty->id}",
            "Type: {$duty->getDutyTypeLabel()}",
        ];

        if ($duty->expense_receipt_number) {
            $notes[] = "Receipt Number: {$duty->expense_receipt_number}";
        }

        if ($duty->recipient_name) {
            $notes[] = "Recipient: {$duty->recipient_name}";
        }

        if ($duty->notes) {
            $notes[] = "Notes: {$duty->notes}";
        }

        return implode("\n", $notes);
    }

    /**
     * Build description for personal expense
     */
    private function buildPersonalDescription(PersonalDuty $duty): string
    {
        $type = $duty->getDutyTypeLabel();
        return "Personal Expense - {$type}: {$duty->title}";
    }

    /**
     * Build notes for personal expense
     */
    private function buildPersonalNotes(PersonalDuty $duty): string
    {
        $notes = [
            "Personal Duty ID: {$duty->id}",
            "Type: {$duty->getDutyTypeLabel()}",
        ];

        if ($duty->vendor_name) {
            $notes[] = "Vendor: {$duty->vendor_name}";
        }

        if ($duty->receipt_reference) {
            $notes[] = "Receipt: {$duty->receipt_reference}";
        }

        if ($duty->employer_name) {
            $notes[] = "Employer: {$duty->employer_name}";
        }

        if ($duty->budget_amount) {
            $variance = $duty->getBudgetVariance();
            $notes[] = "Budget: MWK " . number_format($duty->budget_amount, 2);
            $notes[] = "Variance: MWK " . number_format($variance ?? 0, 2);
        }

        if ($duty->notes) {
            $notes[] = "Notes: {$duty->notes}";
        }

        return implode("\n", $notes);
    }
}
