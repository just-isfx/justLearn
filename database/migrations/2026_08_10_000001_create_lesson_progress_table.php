<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lesson_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('lesson_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('progress_percentage')->default(0);
            $table->unsignedInteger('time_spent_seconds')->default(0);
            $table->timestamp('completed_at')->nullable();
            $table->unsignedSmallInteger('last_position')->default(0);
            $table->timestamp('last_accessed_at')->nullable();
            $table->timestamps();

            // Ensure only one progress record per user and lesson
            $table->unique(['user_id', 'lesson_id']);

            // Indexes for common queries
            $table->index('user_id');
            $table->index('lesson_id');
            $table->index('completed_at');
            $table->index('last_accessed_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lesson_progress');
    }
};
