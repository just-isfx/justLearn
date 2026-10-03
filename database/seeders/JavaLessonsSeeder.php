<?php

namespace Database\Seeders;

class JavaLessonsSeeder extends LanguageLessonsSeeder
{
    protected function languageId(): int { return 8; }
    protected function languageSlug(): string { return 'java'; }
    protected function courseIds(): array
    {
        return [49 => 'java-fundamentals', 50 => 'java-control-structures', 51 => 'java-oop', 52 => 'java-collections', 53 => 'java-exception-handling', 54 => 'intermediate-java', 55 => 'java-projects'];
    }
}