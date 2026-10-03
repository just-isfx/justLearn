<?php

namespace Database\Seeders;

class ReactLessonsSeeder extends LanguageLessonsSeeder
{
    protected function languageId(): int { return 5; }
    protected function languageSlug(): string { return 'react'; }
    protected function courseIds(): array
    {
        return [27 => 'react-fundamentals', 28 => 'react-components-props', 29 => 'react-state-events', 30 => 'react-hooks', 31 => 'react-router', 32 => 'react-working-with-apis', 33 => 'intermediate-react-patterns', 34 => 'building-full-react-apps'];
    }
}