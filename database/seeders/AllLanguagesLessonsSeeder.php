<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class AllLanguagesLessonsSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            CssLessonsSeeder::class,
            PhpLessonsSeeder::class,
            PythonLessonsSeeder::class,
            ReactLessonsSeeder::class,
            CSharpLessonsSeeder::class,
            JavaScriptLessonsSeeder::class,
            JavaLessonsSeeder::class,
            CppLessonsSeeder::class,
            SqlLessonsSeeder::class,
            PascalLessonsSeeder::class,
            RustLessonsSeeder::class,
            SwiftLessonsSeeder::class,
            TypeScriptLessonsSeeder::class,
            ReactNativeLessonsSeeder::class,
        ]);
    }
}