<?php

namespace Database\Seeders;

class ReactNativeLessonsSeeder extends LanguageLessonsSeeder
{
    protected function languageId(): int { return 15; }
    protected function languageSlug(): string { return 'react-native'; }
    protected function courseIds(): array
    {
        return [104 => 'react-native-fundamentals', 105 => 'react-native-components-styling', 106 => 'react-native-navigation', 107 => 'react-native-state-management', 108 => 'react-native-apis', 109 => 'Intermediate React Native', 110 => 'react-native-building-apps'];
    }
}