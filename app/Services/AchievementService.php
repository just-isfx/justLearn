<?php

namespace App\Services;

use App\Models\Achievement;
use App\Models\LessonProgress;
use App\Models\QuizAttempt;
use App\Models\User;
use App\Models\UserAchievement;
use Illuminate\Support\Facades\DB;

class AchievementService
{
    public function evaluate(User $user): void
    {
        $counts = [
            'lessons_completed' => LessonProgress::where('user_id', $user->id)->whereNotNull('completed_at')->count(),
            'quizzes_completed' => QuizAttempt::where('user_id', $user->id)->count(),
            'quizzes_passed' => QuizAttempt::where('user_id', $user->id)->where('passed', true)->count(),
            'streak_days' => (int) ($user->learningStreak?->current_streak ?? 0),
        ];

        foreach (Achievement::all() as $achievement) {
            if (($counts[$achievement->requirement_type] ?? 0) < $achievement->requirement_value) continue;
            if (UserAchievement::where('user_id', $user->id)->where('achievement_id', $achievement->id)->exists()) continue;

            DB::transaction(function () use ($user, $achievement) {
                UserAchievement::firstOrCreate(
                    ['user_id' => $user->id, 'achievement_id' => $achievement->id],
                    ['unlocked_at' => now()]
                );
                $user->notifications()->create([
                    'type' => 'achievement_unlocked',
                    'title' => 'Achievement unlocked',
                    'message' => $achievement->name . ': ' . $achievement->description,
                ]);
            });
        }
    }
}
