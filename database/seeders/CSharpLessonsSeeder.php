<?php

namespace Database\Seeders;

class CSharpLessonsSeeder extends LanguageLessonsSeeder
{
    protected function languageId(): int { return 6; }
    protected function languageSlug(): string { return 'csharp'; }
    protected function courseIds(): array
    {
        return [63 => 'csharp-fundamentals', 64 => 'csharp-oop', 65 => 'csharp-collections-linq', 66 => 'csharp-exception-handling', 67 => 'csharp-working-with-files', 68 => 'intermediate-csharp', 69 => 'csharp-building-apps'];
    }
}