<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\WatchHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Services\LearningActivityService;

class ProgressController extends Controller
{
    /**
     * Get progress for a specific lesson.
     * GET /api/lessons/{id}/progress
     */
    public function getProgress($lessonId)
    {
        $user = Auth::user();
        $lesson = Lesson::findOrFail($lessonId);

        $progress = LessonProgress::where('user_id', $user->id)
            ->where('lesson_id', $lessonId)
            ->first();

        if (!$progress) {
            return response()->json([
                'progress_percentage' => 0,
                'time_spent_seconds' => 0,
                'last_position' => 0,
                'completed_at' => null,
                'last_accessed_at' => null,
            ]);
        }

        return response()->json([
            'id' => $progress->id,
            'progress_percentage' => $progress->progress_percentage,
            'time_spent_seconds' => $progress->time_spent_seconds,
            'last_position' => $progress->last_position,
            'completed_at' => $progress->completed_at,
            'last_accessed_at' => $progress->last_accessed_at,
            'is_completed' => $progress->isCompleted(),
        ]);
    }

    /**
     * Create or update progress for a lesson.
     * POST /api/lessons/{id}/progress
     */
    public function upsertProgress(Request $request, $lessonId, LearningActivityService $activity)
    {
        $user = Auth::user();
        $lesson = Lesson::findOrFail($lessonId);

        $validated = $request->validate([
            'progress_percentage' => 'required|integer|min:0|max:100',
            'time_spent_seconds' => 'required|integer|min:0',
            'last_position' => 'integer|min:0',
        ]);

        // Prevent invalid progress changes
        $validated['progress_percentage'] = max(0, min(100, $validated['progress_percentage']));

        // Find or create progress record
        $progress = LessonProgress::firstOrCreate(
            [
                'user_id' => $user->id,
                'lesson_id' => $lessonId,
            ],
            [
                'progress_percentage' => 0,
                'time_spent_seconds' => 0,
                'last_position' => 0,
            ]
        );

        // Update progress
        $progress->progress_percentage = $validated['progress_percentage'];
        $progress->time_spent_seconds = $validated['time_spent_seconds'];
        $progress->last_position = $validated['last_position'] ?? $progress->last_position;
        $progress->last_accessed_at = now();

        // Mark as complete if progress reaches 100%
        $wasCompleted = $progress->isCompleted();
        if ($validated['progress_percentage'] === 100 && !$wasCompleted) {
            $progress->completed_at = now();
        }

        $progress->save();
        if ($validated['progress_percentage'] > 0) {
            $activity->record($user, 'lesson_progress');
        }
        if (! $wasCompleted && $progress->isCompleted()) {
            $user->notifications()->create([
                'type' => 'lesson_completed',
                'title' => 'Lesson completed',
                'message' => 'You completed ' . $lesson->title . '.',
            ]);
        }

        // Update watch history
        $this->updateWatchHistory($user->id, $lessonId, $validated);

        return response()->json([
            'id' => $progress->id,
            'progress_percentage' => $progress->progress_percentage,
            'time_spent_seconds' => $progress->time_spent_seconds,
            'last_position' => $progress->last_position,
            'completed_at' => $progress->completed_at,
            'last_accessed_at' => $progress->last_accessed_at,
            'is_completed' => $progress->isCompleted(),
        ]);
    }

    /**
     * Update time spent on a lesson.
     * PUT /api/lessons/{id}/time
     */
    public function updateTimeSpent(Request $request, $lessonId)
    {
        $user = Auth::user();
        $lesson = Lesson::findOrFail($lessonId);

        $validated = $request->validate([
            'time_spent_seconds' => 'required|integer|min:0',
        ]);

        $progress = LessonProgress::firstOrCreate(
            [
                'user_id' => $user->id,
                'lesson_id' => $lessonId,
            ],
            [
                'progress_percentage' => 0,
                'time_spent_seconds' => 0,
            ]
        );

        $progress->time_spent_seconds = $validated['time_spent_seconds'];
        $progress->last_accessed_at = now();
        $progress->save();

        return response()->json([
            'time_spent_seconds' => $progress->time_spent_seconds,
        ]);
    }

    /**
     * Get user's learning history.
     * GET /api/my/history
     */
    public function getHistory(Request $request)
    {
        $user = Auth::user();
        $perPage = $request->get('per_page', 15);

        $history = LessonProgress::with(['lesson.course', 'lesson.course.programmingLanguage'])
            ->where('user_id', $user->id)
            ->orderBy('last_accessed_at', 'desc')
            ->paginate($perPage);

        return response()->json([
            'data' => $history->map(function ($progress) {
                return [
                    'id' => $progress->id,
                    'lesson_id' => $progress->lesson_id,
                    'lesson_title' => $progress->lesson->title,
                    'lesson_slug' => $progress->lesson->slug,
                    'course_title' => $progress->lesson->course->title,
                    'course_slug' => $progress->lesson->course->slug,
                    'progress_percentage' => $progress->progress_percentage,
                    'time_spent_seconds' => $progress->time_spent_seconds,
                    'formatted_time' => $progress->formattedTimeSpent(),
                    'last_accessed_at' => $progress->last_accessed_at,
                    'completed_at' => $progress->completed_at,
                    'is_completed' => $progress->isCompleted(),
                ];
            }),
            'pagination' => [
                'current_page' => $history->currentPage(),
                'per_page' => $history->perPage(),
                'total' => $history->total(),
                'last_page' => $history->lastPage(),
            ],
        ]);
    }

    /**
     * Update the watch history whenever progress is updated.
     */
    private function updateWatchHistory($userId, $lessonId, $data)
    {
        $history = WatchHistory::firstOrCreate(
            [
                'user_id' => $userId,
                'lesson_id' => $lessonId,
            ],
            [
                'progress_percentage' => 0,
                'time_spent_seconds' => 0,
            ]
        );

        $history->progress_percentage = $data['progress_percentage'];
        $history->time_spent_seconds = $data['time_spent_seconds'];
        $history->last_accessed_at = now();
        $history->save();
    }
}
