<?php

namespace Database\Seeders;

use App\Models\Achievement;
use Illuminate\Database\Seeder;

class AchievementSeeder extends Seeder
{
    public function run(): void
    {
        $achievements = [
            ['name' => 'First Lesson', 'slug' => 'first-lesson', 'description' => 'Complete your first lesson.', 'icon' => 'book', 'requirement_type' => 'lessons_completed', 'requirement_value' => 1],
            ['name' => 'Getting Started', 'slug' => 'getting-started', 'description' => 'Complete 5 lessons.', 'icon' => 'spark', 'requirement_type' => 'lessons_completed', 'requirement_value' => 5],
            ['name' => 'Dedicated Learner', 'slug' => 'dedicated-learner', 'description' => 'Complete 10 lessons.', 'icon' => 'star', 'requirement_type' => 'lessons_completed', 'requirement_value' => 10],
            ['name' => 'First Quiz', 'slug' => 'first-quiz', 'description' => 'Complete your first quiz.', 'icon' => 'check', 'requirement_type' => 'quizzes_completed', 'requirement_value' => 1],
            ['name' => 'Quiz Master', 'slug' => 'quiz-master', 'description' => 'Pass 5 quizzes.', 'icon' => 'trophy', 'requirement_type' => 'quizzes_passed', 'requirement_value' => 5],
            ['name' => 'Consistent Learner', 'slug' => 'consistent-learner', 'description' => 'Maintain a 7-day learning streak.', 'icon' => 'flame', 'requirement_type' => 'streak_days', 'requirement_value' => 7],
        ];
        foreach ($achievements as $achievement) Achievement::updateOrCreate(['slug' => $achievement['slug']], $achievement);
    }
}
