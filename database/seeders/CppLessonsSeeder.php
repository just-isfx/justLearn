<?php

namespace Database\Seeders;

class CppLessonsSeeder extends LanguageLessonsSeeder
{
    protected function languageId(): int { return 9; }
    protected function languageSlug(): string { return 'c++'; }
    protected function courseIds(): array
    {
        return [56 => 'cpp-fundamentals', 57 => 'cpp-control-flow-functions', 58 => 'cpp-arrays-pointers', 59 => 'cpp-oop', 60 => 'intermediate-cpp', 61 => 'cpp-data-structures', 62 => 'cpp-projects'];
    }
}