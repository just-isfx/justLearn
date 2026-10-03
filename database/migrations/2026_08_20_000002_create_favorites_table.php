<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('favorites', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            // Polymorphic relationship — stores Course, Lesson, or LibraryArticle
            $table->string('favoritable_type', 100);
            $table->unsignedBigInteger('favoritable_id');

            $table->timestamps();

            // A user can only favorite the same item once
            $table->unique(['user_id', 'favoritable_type', 'favoritable_id'], 'favorites_unique');

            $table->index('user_id');
            $table->index(['favoritable_type', 'favoritable_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('favorites');
    }
};
