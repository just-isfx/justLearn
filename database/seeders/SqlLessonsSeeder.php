<?php

namespace Database\Seeders;

class SqlLessonsSeeder extends LanguageLessonsSeeder
{
    protected function languageId(): int { return 10; }
    protected function languageSlug(): string { return 'sql'; }
    protected function courseIds(): array
    {
        return [70 => 'sql-fundamentals', 71 => 'sql-filtering-sorting', 72 => 'sql-joins', 73 => 'sql-aggregate-functions', 74 => 'sql-subqueries', 75 => 'sql-database-design-basics', 76 => 'intermediate-sql'];
    }
}