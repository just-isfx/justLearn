<?php

namespace Database\Seeders;

class PhpLessonsSeeder extends LanguageLessonsSeeder
{
    protected function languageId(): int { return 3; }
    protected function languageSlug(): string { return 'php'; }
    protected function courseIds(): array
    {
        return [42 => 'php-fundamentals', 43 => 'php-working-with-forms', 44 => 'php-and-mysql', 45 => 'php-sessions-authentication', 46 => 'object-oriented-php', 47 => 'intermediate-php', 48 => 'building-simple-php-app'];
    }
}