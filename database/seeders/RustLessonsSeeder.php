<?php

namespace Database\Seeders;

class RustLessonsSeeder extends LanguageLessonsSeeder
{
    protected function languageId(): int { return 12; }
    protected function languageSlug(): string { return 'rust'; }
    protected function courseIds(): array
    {
        return [84 => 'rust-fundamentals', 85 => 'rust-ownership-borrowing', 86 => 'rust-structs-enums', 87 => 'rust-error-handling', 88 => 'rust-collections', 89 => 'intermediate-rust', 90 => 'rust-cli-tools'];
    }
}