<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('icon')->nullable();
            $table->timestamps();
        });

        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('file_path');
            $table->string('original_filename');
            $table->string('mime_type');
            $table->bigInteger('file_size');
            $table->string('file_type'); // 'image', 'video', 'document', 'spreadsheet', 'presentation', 'other'
            $table->foreignId('category_id')->nullable()->constrained('document_categories')->onDelete('set null');
            $table->foreignId('uploaded_by')->constrained('users')->onDelete('cascade');
            $table->string('module')->index(); // 'finance', 'hr', 'assets', 'control_room', 'front_office', 'maintenance'
            $table->string('department')->nullable()->index(); // optional department/section
            $table->integer('download_count')->default(0);
            $table->integer('comments_count')->default(0);
            $table->string('access_level')->default('private'); // 'private', 'department', 'module', 'public'
            $table->text('tags')->nullable(); // comma-separated or JSON
            $table->timestamp('expires_at')->nullable();
            $table->boolean('is_archived')->default(false);
            $table->timestamps();
            $table->softDeletes();
            
            $table->index(['module', 'category_id', 'created_at']);
            
            // Only add fulltext index for MySQL/MariaDB
            if (config('database.default') === 'mysql') {
                $table->fullText(['title', 'description', 'tags']);
            }
        });

        Schema::create('document_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained('documents')->onDelete('cascade');
            $table->string('file_path');
            $table->bigInteger('file_size');
            $table->string('mime_type');
            $table->integer('version_number');
            $table->foreignId('created_by')->constrained('users');
            $table->text('change_log')->nullable();
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('document_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained('documents')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->text('comment');
            $table->foreignId('parent_id')->nullable()->constrained('document_comments')->onDelete('cascade');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('document_shares', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained('documents')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('permission')->default('view'); // 'view', 'edit'
            $table->foreignId('shared_by')->constrained('users')->onDelete('set null');
            $table->timestamp('shared_at');
            $table->timestamps();
            
            $table->unique(['document_id', 'user_id']);
        });

        Schema::create('document_downloads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained('documents')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('created_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_downloads');
        Schema::dropIfExists('document_shares');
        Schema::dropIfExists('document_comments');
        Schema::dropIfExists('document_versions');
        Schema::dropIfExists('documents');
        Schema::dropIfExists('document_categories');
    }
};
