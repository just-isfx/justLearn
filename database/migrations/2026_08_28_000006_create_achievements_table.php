<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration { public function up(): void { Schema::create('achievements', function (Blueprint $table) { $table->id(); $table->string('name'); $table->string('slug')->unique(); $table->text('description'); $table->string('icon', 20)->nullable(); $table->string('requirement_type'); $table->unsignedInteger('requirement_value')->default(1); $table->timestamps(); }); } public function down(): void { Schema::dropIfExists('achievements'); } };
