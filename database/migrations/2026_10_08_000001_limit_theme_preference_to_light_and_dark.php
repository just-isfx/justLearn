<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')
            ->where(function ($query) {
                $query->whereNull('theme_preference')
                    ->orWhereNotIn('theme_preference', ['light', 'dark']);
            })
            ->update(['theme_preference' => 'light']);

        Schema::table('users', function (Blueprint $table) {
            $table->string('theme_preference', 10)->nullable()->default('light')->change();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('theme_preference', 10)->nullable()->default('light')->change();
        });
    }
};
