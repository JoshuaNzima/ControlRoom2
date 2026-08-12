<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Fix commissions table schema - safely handle existing table.
     * The previous migration (2026_02_24_183103) used Schema::table but SQLite requires
     * the table to exist. This migration checks existence and only adds missing columns.
     */
    public function up(): void
    {
        if (!Schema::hasTable('commissions')) {
            Schema::create('commissions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('client_id')->constrained('clients');
                $table->decimal('total_amount', 12, 2)->default(0);
                $table->string('source')->default('client_acquisition');
                $table->text('description')->nullable();
                $table->string('status')->default('pending');
                $table->timestamp('approved_at')->nullable();
                $table->foreignId('approved_by')->nullable()->constrained('users');
                $table->timestamp('paid_at')->nullable();
                $table->foreignId('paid_by')->nullable()->constrained('users');
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->index(['client_id', 'status']);
                $table->index(['status', 'created_at']);
            });
        } else {
            // Table exists - add any missing columns
            $columns = Schema::getColumnListing('commissions');

            if (!in_array('total_amount', $columns)) {
                Schema::table('commissions', function (Blueprint $table) {
                    $table->decimal('total_amount', 12, 2)->default(0);
                });
            }

            if (!in_array('description', $columns)) {
                Schema::table('commissions', function (Blueprint $table) {
                    $table->text('description')->nullable();
                });
            }

            if (!in_array('approved_at', $columns)) {
                Schema::table('commissions', function (Blueprint $table) {
                    $table->timestamp('approved_at')->nullable();
                });
            }

            if (!in_array('paid_at', $columns)) {
                Schema::table('commissions', function (Blueprint $table) {
                    $table->timestamp('paid_at')->nullable();
                });
            }

            if (!in_array('paid_by', $columns)) {
                Schema::table('commissions', function (Blueprint $table) {
                    $table->foreignId('paid_by')->nullable()->constrained('users');
                });
            }
        }

        // Create commission_splits table if not exists
        if (!Schema::hasTable('commission_splits')) {
            Schema::create('commission_splits', function (Blueprint $table) {
                $table->id();
                $table->foreignId('commission_id')->constrained('commissions')->onDelete('cascade');
                $table->foreignId('user_id')->constrained('users');
                $table->decimal('percentage', 5, 2)->default(100);
                $table->decimal('amount', 12, 2)->default(0);
                $table->string('role')->default('primary');
                $table->text('notes')->nullable();
                $table->timestamps();
                $table->index(['commission_id', 'user_id']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('commission_splits');
        Schema::dropIfExists('commissions');
    }
};
