<?php

namespace Database\Seeders;

class PythonLessonsSeeder extends LanguageLessonsSeeder
{
    protected function languageId(): int { return 4; }
    protected function languageSlug(): string { return 'python'; }
    protected function courseIds(): array
    {
        return [35 => 'python-fundamentals', 36 => 'python-control-flow-functions', 37 => 'python-data-structures', 38 => 'python-oop', 39 => 'python-files-modules', 40 => 'intermediate-python', 41 => 'python-projects'];
    }
}