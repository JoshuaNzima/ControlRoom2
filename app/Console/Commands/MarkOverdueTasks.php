<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Task;
use App\Notifications\TaskOverdue;

class MarkOverdueTasks extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tasks:mark-overdue';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Mark tasks as overdue when due date has passed';

    /**
     * Execute the console command.
     */
    public function handle(): void
    {
        $overdueTasks = Task::whereIn('status', ['pending', 'in_progress'])
            ->whereNotNull('due_date')
            ->where('due_date', '<', now()->toDateString())
            ->get();

        $count = 0;
        foreach ($overdueTasks as $task) {
            // Add overdue flag to metadata
            $metadata = $task->metadata ?? [];
            $metadata['overdue_since'] = now()->toDateString();
            $task->metadata = $metadata;
            $task->save();

            // Notify assigned user
            if ($task->assignedTo) {
                $task->assignedTo->notify(new TaskOverdue($task));
            }

            $count++;
        }

        $this->info("{$count} tasks marked as overdue.");
    }
}
