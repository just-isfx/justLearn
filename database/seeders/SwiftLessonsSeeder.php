<?php

namespace Database\Seeders;

class SwiftLessonsSeeder extends LanguageLessonsSeeder
{
    protected function languageId(): int { return 13; }
    protected function languageSlug(): string { return 'swift'; }
    protected function courseIds(): array
    {
        return [91 => 'swift-fundamentals', 92 => 'swift-control-flow-functions', 93 => 'swift-collections', 94 => 'swift-oop', 95 => 'swift-optionals-error-handling', 96 => 'intermediate-swift', 97 => 'swift-ios-concepts'];
    }
}