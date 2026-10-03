<?php

namespace Database\Seeders;

class PascalLessonsSeeder extends LanguageLessonsSeeder
{
    protected function languageId(): int { return 11; }
    protected function languageSlug(): string { return 'pascal'; }
    protected function courseIds(): array
    {
        return [77 => 'pascal-fundamentals', 78 => 'pascal-control-structures', 79 => 'pascal-procedures-functions', 80 => 'pascal-arrays-records', 81 => 'pascal-file-handling', 82 => 'intermediate-pascal', 83 => 'pascal-projects'];
    }
}