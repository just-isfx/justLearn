<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private array $languageOrder = [
        'html' => 1,
        'css' => 2,
        'javascript' => 3,
        'php' => 4,
        'react' => 5,
        'react-native' => 6,
        'c++' => 7,
        'csharp' => 8,
        'java' => 9,
        'sql' => 10,
        'python' => 11,
        'pascal' => 12,
        'typescript' => 13,
        'rust' => 14,
        'swift' => 15,
    ];

    public function up(): void
    {
        Schema::table('programming_languages', function (Blueprint $table) {
            $table->unsignedInteger('sort_order')->default(1000)->after('icon');
        });

        foreach ($this->languageOrder as $slug => $order) {
            DB::table('programming_languages')->where('slug', $slug)->update(['sort_order' => $order]);
        }
    }

    public function down(): void
    {
        Schema::table('programming_languages', function (Blueprint $table) {
            $table->dropColumn('sort_order');
        });
    }
};