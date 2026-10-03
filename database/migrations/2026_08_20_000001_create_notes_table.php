<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            $table->string('title', 255);
            $table->text('content');

            // Polymorphic optional link to a course, lesson, or library article
            $table->string('notable_type', 100)->nullable();
            $table->unsignedBigInteger('notable_id')->nullable();

            $table->timestamps();

            // Indexes
            $table->index('user_id');
            $table->index(['notable_type', 'notable_id']);
            $table->index('updated_at'); // for sorting by most-recently-updated
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notes');
    }
};
