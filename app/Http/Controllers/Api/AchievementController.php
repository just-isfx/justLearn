<?php

namespace App\Http\Controllers\Api;

use App\Models\Achievement;
use App\Models\LessonProgress;
use App\Models\QuizAttempt;
use App\Models\UserAchievement;
use Illuminate\Http\Request;

class AchievementController
{
    public function index(Request $request)
    {
        $userId = $request->user()->id;
        $lessons = LessonProgress::where('user_id', $userId)->whereNotNull('completed_at')->count();
        $quizzes = QuizAttempt::where('user_id', $userId)->count();
        $passed = QuizAttempt::where('user_id', $userId)->where('passed', true)->count();
        $streak = (int) ($request->user()->learningStreak?->current_streak ?? 0);
        $counts = compact('lessons', 'quizzes', 'passed', 'streak');
        $typeMap = ['lessons_completed' => 'lessons', 'quizzes_completed' => 'quizzes', 'quizzes_passed' => 'passed', 'streak_days' => 'streak'];
        $unlocked = UserAchievement::where('user_id', $userId)->get()->keyBy('achievement_id');

        return response()->json(['data' => Achievement::orderBy('id')->get()->map(function ($achievement) use ($counts, $typeMap, $unlocked) {
            $current = $counts[$typeMap[$achievement->requirement_type] ?? 'lessons'] ?? 0;
            $record = $unlocked->get($achievement->id);
            return [
                'id' => $achievement->id, 'name' => $achievement->name, 'slug' => $achievement->slug,
                'description' => $achievement->description, 'icon' => $achievement->icon,
                'progress' => min($current, $achievement->requirement_value),
                'requirement' => $achievement->requirement_value, 'unlocked' => (bool) $record,
                'unlocked_at' => $record?->unlocked_at,
            ];
        })]);
    }
}
