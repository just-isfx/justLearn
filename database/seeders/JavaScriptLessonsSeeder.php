<?php

namespace Database\Seeders;

class JavaScriptLessonsSeeder extends LanguageLessonsSeeder
{
    protected function languageId(): int { return 7; }
    protected function languageSlug(): string { return 'javascript'; }
    protected function courseIds(): array
    {
        return [20 => 'javascript-fundamentals', 21 => 'dom-manipulation', 22 => 'intermediate-javascript', 23 => 'asynchronous-javascript', 24 => 'modern-ecmascript-6', 25 => 'javascript-projects', 26 => 'javascript-best-practices'];
    }
}