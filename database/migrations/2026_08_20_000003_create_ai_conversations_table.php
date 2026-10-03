<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_conversations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title', 255)->default('New Conversation');
            $table->timestamps();

            $table->index('user_id');
            $table->index('updated_at'); // for sorting most-recent first
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_conversations');
    }
};
