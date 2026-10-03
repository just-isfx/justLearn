<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Translation-ready educational content (Stage 7).
 *
 * Canonical lesson/course/article text stays on the original tables
 * (language-independent IDs, slugs, and source copy). Future locales
 * store translated title, description, and content here without
 * duplicating entire Stage 3 records.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('content_translations', function (Blueprint $table) {
            $table->id();
            $table->morphs('translatable');
            $table->string('locale', 8);
            $table->string('title')->nullable();
            $table->text('description')->nullable();
            $table->longText('content')->nullable();
            $table->timestamps();

            $table->unique(
                ['translatable_type', 'translatable_id', 'locale'],
                'content_translations_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('content_translations');
    }
};
