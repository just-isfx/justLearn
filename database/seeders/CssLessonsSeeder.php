<?php

namespace Database\Seeders;

class CssLessonsSeeder extends LanguageLessonsSeeder
{
    protected function languageId(): int { return 2; }
    protected function languageSlug(): string { return 'css'; }
    protected function courseIds(): array
    {
        return [2 => 'bootstrap', 13 => 'css-fundamentals', 14 => 'css-layouts', 15 => 'responsive-design', 16 => 'css-animations-transitions', 17 => 'advanced-css-selectors-specificity', 18 => 'css-architecture-best-practices', 19 => 'building-beautiful-ui-css'];
    }
}