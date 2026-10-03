<?php

namespace Database\Seeders;

class TypeScriptLessonsSeeder extends LanguageLessonsSeeder
{
    protected function languageId(): int { return 14; }
    protected function languageSlug(): string { return 'typescript'; }
    protected function courseIds(): array
    {
        return [98 => 'typescript-fundamentals', 99 => 'typescript-types-interfaces', 100 => 'typescript-functions-objects', 101 => 'typescript-generics', 102 => 'intermediate-typescript', 103 => 'typescript-js-projects'];
    }
}