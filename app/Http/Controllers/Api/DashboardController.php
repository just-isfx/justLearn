<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LessonProgress;
use App\Models\QuizAttempt;
use App\Models\UserAchievement;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    /**
     * Get dashboard data for the authenticated user.
     * GET /api/my/dashboard
     */
    public function getData()
    {
        $user = Auth::user();

        $stats = $this->calculateStats($user->id);
        $continueLearning = $this->getContinueLearning($user->id);
        $recentActivity = $this->getRecentActivity($user->id);

        return response()->json([
            'statistics' => $stats,
            'continue_learning' => $continueLearning,
            'recent_activity' => $recentActivity,
            'streak' => $user->learningStreak,
            'achievements' => UserAchievement::with('achievement')->where('user_id', $user->id)->latest('unlocked_at')->limit(3)->get(),
            'unread_notifications' => $user->notifications()->whereNull('read_at')->count(),
        ]);
    }

    /**
     * Calculate dashboard statistics for a user.
     */
    private function calculateStats($userId): array
    {
        $validProgress = LessonProgress::query()
            ->join('lessons', 'lesson_progress.lesson_id', '=', 'lessons.id')
            ->where('lesson_progress.user_id', $userId);

        $coursesInteracted = (clone $validProgress)
            ->distinct('lessons.course_id')
            ->count('lessons.course_id');

        // Count completed lessons
        $completedLessons = (clone $validProgress)
            ->whereNotNull('lesson_progress.completed_at')
            ->count();

        // Total time spent
        $totalTimeSpent = (clone $validProgress)
            ->sum('lesson_progress.time_spent_seconds');

        $totalLessons = \App\Models\Lesson::query()->count();

        // Calculate overall progress
        $overallProgress = $this->calculateOverallProgress($userId);
        $quizAttempts = QuizAttempt::where('user_id', $userId);

        return [
            'courses' => $coursesInteracted,
            'lessons_completed' => $completedLessons,
            'total_lessons' => $totalLessons,
            'learning_time_seconds' => $totalTimeSpent,
            'learning_time_formatted' => $this->formatTimeSpent($totalTimeSpent),
            'overall_progress' => $overallProgress,
            'completion_percentage' => $overallProgress,
            'quizzes_taken' => (clone $quizAttempts)->count(),
            'quiz_average_score' => round((float) ((clone $quizAttempts)->avg('percentage') ?? 0), 2),
        ];
    }

    /**
     * Get the lesson the user should continue learning.
     */
    private function getContinueLearning($userId): ?array
    {
        // Find most recently active incomplete lesson
        $progress = LessonProgress::with(['lesson.course'])
            ->where('user_id', $userId)
            ->whereHas('lesson.course')
            ->whereNull('completed_at')
            ->orderBy('last_accessed_at', 'desc')
            ->first();

        if ($progress) {
            return [
                'course_title' => $progress->lesson?->course?->title,
                'course_slug' => $progress->lesson?->course?->slug,
                'lesson_title' => $progress->lesson?->title,
                'lesson_slug' => $progress->lesson?->slug,
                'lesson_id' => $progress->lesson?->id,
                'progress_percentage' => $progress->progress_percentage ?? 0,
            ];
        }

        // If no incomplete lessons, find the first lesson from a course the user started
        $firstCourseStarted = LessonProgress::with(['lesson.course'])
            ->where('user_id', $userId)
            ->whereHas('lesson.course')
            ->orderBy('created_at', 'asc')
            ->first();

        if ($firstCourseStarted) {
            $firstLesson = $firstCourseStarted->lesson?->course?->lessons()->first();
            if (! $firstLesson) {
                return null;
            }

            return [
                'course_title' => $firstCourseStarted->lesson?->course?->title,
                'course_slug' => $firstCourseStarted->lesson?->course?->slug,
                'lesson_title' => $firstLesson->title,
                'lesson_slug' => $firstLesson->slug,
                'lesson_id' => $firstLesson->id,
                'progress_percentage' => 0,
            ];
        }

        // If user has never started anything, return null
        return null;
    }

    /**
     * Get recent activity for the user.
     */
    private function getRecentActivity($userId): array
    {
        $activities = LessonProgress::with(['lesson'])
            ->where('user_id', $userId)
            ->whereHas('lesson.course')
            ->orderBy('last_accessed_at', 'desc')
            ->limit(5)
            ->get();

        return $activities->map(function ($progress) {
            return [
                'course_slug' => $progress->lesson?->course?->slug,
                'lesson_title' => $progress->lesson?->title,
                'lesson_slug' => $progress->lesson?->slug,
                'lesson_id' => $progress->lesson?->id,
                'progress_percentage' => $progress->progress_percentage,
                'is_completed' => $progress->isCompleted(),
                'last_accessed_at' => $progress->last_accessed_at,
                'time_ago' => $progress->last_accessed_at ? $this->getTimeAgo($progress->last_accessed_at) : null,
            ];
        })->toArray();
    }

    /**
     * Calculate overall progress based on user's learning activity.
     */
    private function calculateOverallProgress($userId): int
    {
        $validProgress = LessonProgress::query()
            ->join('lessons', 'lesson_progress.lesson_id', '=', 'lessons.id')
            ->where('lesson_progress.user_id', $userId);

        $completedLessons = (clone $validProgress)
            ->whereNotNull('lesson_progress.completed_at')
            ->count();

        $totalLessonsStarted = (clone $validProgress)->count();

        if ($totalLessonsStarted === 0) {
            return 0;
        }

        return (int) ceil(($completedLessons / $totalLessonsStarted) * 100);
    }

    /**
     * Format time spent in seconds to a readable format.
     */
    private function formatTimeSpent($seconds): string
    {
        $seconds = (int) $seconds;
        if ($seconds === 0) {
            return '0 min';
        }

        $hours = intdiv($seconds, 3600);
        $minutes = intdiv($seconds % 3600, 60);

        if ($hours > 0) {
            if ($minutes > 0) {
                return "{$hours} hr " . ($hours > 1 ? '' : '') . "{$minutes} min";
            }
            return "{$hours} hr" . ($hours > 1 ? 's' : '');
        }

        return "{$minutes} min";
    }

    /**
     * Get human-readable time difference.
     */
    private function getTimeAgo($datetime): string
    {
        $now = now();
        $diff = $now->diffInSeconds($datetime);

        if ($diff < 60) {
            return 'Just now';
        }

        $minutes = intdiv($diff, 60);
        if ($minutes < 60) {
            return $minutes === 1 ? '1 min ago' : "{$minutes} mins ago";
        }

        $hours = intdiv($minutes, 60);
        if ($hours < 24) {
            return $hours === 1 ? '1 hour ago' : "{$hours} hours ago";
        }

        $days = intdiv($hours, 24);
        if ($days === 1) {
            return 'Yesterday';
        }

        if ($days < 7) {
            return "{$days} days ago";
        }

        return $datetime->format('M d');
    }
}
