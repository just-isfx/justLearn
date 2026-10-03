<?php

namespace App\Services;

use App\Models\LearningStreak;
use App\Models\User;
use Carbon\Carbon;

class LearningActivityService
{
    public function __construct(private AchievementService $achievements) {}

    public function record(User $user, string $type): LearningStreak
    {
        $today = Carbon::today(config('app.timezone'));
        $streak = LearningStreak::firstOrCreate(['user_id' => $user->id]);
        $last = $streak->last_activity_date;

        if (! $last) {
            $streak->current_streak = 1;
        } elseif ($last->isSameDay($today)) {
            return $streak;
        } elseif ($last->copy()->addDay()->isSameDay($today)) {
            $streak->current_streak++;
        } else {
            $streak->current_streak = 1;
        }

        $streak->last_activity_date = $today;
        $streak->longest_streak = max($streak->longest_streak, $streak->current_streak);
        $streak->save();
        $user->setRelation('learningStreak', $streak);
        $this->achievements->evaluate($user);

        if (in_array($streak->current_streak, [3, 7, 14, 30], true)) {
            $user->notifications()->firstOrCreate([
                'type' => 'streak_milestone',
                'message' => 'You have learned for ' . $streak->current_streak . ' consecutive days.',
            ], [
                'title' => 'Learning streak milestone',
                'read_at' => null,
            ]);
        }

        return $streak;
    }
}
