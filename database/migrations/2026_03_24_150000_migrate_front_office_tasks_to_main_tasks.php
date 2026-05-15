<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Only migrate if the source table exists
        if (!Schema::hasTable('front_office_tasks')) {
            return;
        }

        // Migrate FrontOfficeTask data to main tasks table
        $frontOfficeTasks = DB::table('front_office_tasks')->get();

        foreach ($frontOfficeTasks as $task) {
            // Map category to a task category if it exists
            $categoryId = null;
            if ($task->category) {
                $category = DB::table('task_categories')->where('name', $task->category)->first();
                if (!$category) {
                    $categoryId = DB::table('task_categories')->insertGetId([
                        'name' => $task->category,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                } else {
                    $categoryId = $category->id;
                }
            }

            // Insert into main tasks table
            $newTaskId = DB::table('tasks')->insertGetId([
                'title' => $task->title,
                'description' => $task->description,
                'assigned_to' => $task->assigned_to,
                'created_by' => $task->created_by,
                'due_date' => $task->due_date,
                'priority' => $task->priority ?? 'medium',
                'status' => $task->status === 'completed' ? 'completed' : ($task->status ?? 'pending'),
                'module' => 'front_office',
                'completed_at' => $task->completed_at,
                'completed_by' => $task->completed_by,
                'metadata' => null,
                'created_at' => $task->created_at ?? now(),
                'updated_at' => $task->updated_at ?? now(),
            ]);

            // Attach category if exists
            if ($categoryId) {
                DB::table('task_category_task')->insert([
                    'task_id' => $newTaskId,
                    'task_category_id' => $categoryId,
                ]);
            }
        }

        // Drop front_office_tasks table after migration
        Schema::dropIfExists('front_office_tasks');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Recreate front_office_tasks table (simplified, data not recoverable)
        Schema::create('front_office_tasks', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->foreignId('assigned_to')->nullable()->constrained('users');
            $table->foreignId('created_by')->constrained('users');
            $table->date('due_date')->nullable();
            $table->string('priority')->default('medium');
            $table->string('category')->nullable();
            $table->string('status')->default('pending');
            $table->timestamp('completed_at')->nullable();
            $table->foreignId('completed_by')->nullable()->constrained('users');
            $table->timestamps();
        });
    }
};
