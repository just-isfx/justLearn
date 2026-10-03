<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\LibraryArticle;
use App\Models\LibraryCategory;
use App\Models\ProgrammingLanguage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EducationController extends Controller
{
    public function languages()
    {
        $languages = ProgrammingLanguage::query()->orderBy('sort_order')->orderBy('id')->get();

        return response()->json([
            'data' => $languages,
        ]);
    }

    public function showLanguage(string $slug)
    {
        $language = ProgrammingLanguage::with('courses')->where('slug', $slug)->firstOrFail();

        return response()->json([
            'data' => $language,
        ]);
    }

    public function coursesByLanguage(string $slug)
    {
        $language = ProgrammingLanguage::where('slug', $slug)->firstOrFail();
        $courses = $language->courses()->orderBy('level')->orderBy('title')->get();

        return response()->json([
            'data' => $courses,
        ]);
    }

    public function showCourse(string $slug)
    {
        $course = Course::with(['programmingLanguage', 'lessons', 'quizzes:id,course_id,title,description,passing_score'])->where('slug', $slug)->firstOrFail();

        return response()->json([
            'data' => $course,
        ]);
    }

    public function continueCourse(int $courseId, Request $request)
    {
        $course = Course::findOrFail($courseId);
        $currentProgress = LessonProgress::query()
            ->where('user_id', $request->user()->id)
            ->whereNull('completed_at')
            ->whereHas('lesson', fn ($query) => $query->where('course_id', $course->id))
            ->orderByDesc('last_accessed_at')
            ->orderByDesc('updated_at')
            ->first();

        $lesson = $currentProgress?->lesson;
        $lesson ??= $course->lessons()
            ->whereDoesntHave('progress', fn ($query) => $query
                ->where('user_id', $request->user()->id)
                ->whereNotNull('completed_at'))
            ->first(['id', 'course_id', 'title', 'slug', 'lesson_order']);

        return response()->json(['data' => [
            'course_id' => $course->id,
            'lesson' => $lesson,
            'is_complete' => $lesson === null && $course->lessons()->exists(),
        ]]);
    }

    public function lessonsByCourse(string $slug)
    {
        $course = Course::where('slug', $slug)->firstOrFail();
        $lessons = $course->lessons()->get();

        return response()->json([
            'data' => $lessons,
        ]);
    }

    public function showLesson(string $slug)
    {
        $lesson = Lesson::with([
            'course.programmingLanguage',
            'course.lessons:id,course_id,title,slug,lesson_order',
            'quizzes:id,lesson_id,title,description,passing_score',
        ])->where('slug', $slug)->firstOrFail();

        return response()->json([
            'data' => $lesson,
        ]);
    }

    public function libraryCategories()
    {
        $categories = LibraryCategory::query()->orderBy('name')->get();

        return response()->json([
            'data' => $categories,
        ]);
    }

    public function showLibraryCategory(string $slug)
    {
        $category = LibraryCategory::with('articles')->where('slug', $slug)->firstOrFail();

        return response()->json([
            'data' => $category,
        ]);
    }

    public function libraryArticles(Request $request)
    {
        $query = LibraryArticle::query()->with('category');

        if ($request->filled('q')) {
            $query->where(function ($builder) use ($request) {
                $builder->where('title', 'like', '%' . $request->q . '%')
                    ->orWhere('summary', 'like', '%' . $request->q . '%')
                    ->orWhere('content', 'like', '%' . $request->q . '%');
            });
        }

        $articles = $query->orderBy('title')->get();

        return response()->json([
            'data' => $articles,
        ]);
    }

    public function showLibraryArticle(string $slug)
    {
        $article = LibraryArticle::with('category')->where('slug', $slug)->firstOrFail();

        return response()->json([
            'data' => $article,
        ]);
    }

    public function search(Request $request)
    {
        $query = $request->input('q', '');

        if ($query === '') {
            return response()->json(['data' => []]);
        }

        $articles = LibraryArticle::query()
            ->where('title', 'like', '%' . $query . '%')
            ->orWhere('summary', 'like', '%' . $query . '%')
            ->orWhere('content', 'like', '%' . $query . '%')
            ->get();

        return response()->json([
            'data' => $articles,
        ]);
    }

    /**
     * GET /api/my/courses/{slug}/progress
     * Returns per-lesson progress for the authenticated user within a course.
     */
    public function courseProgress(string $slug)
    {
        $userId = Auth::id();
        $course = Course::with(['lessons' => fn ($q) => $q->orderBy('lesson_order')])
            ->where('slug', $slug)
            ->firstOrFail();

        $lessonIds = $course->lessons->pluck('id');

        // Load all progress records for this user+course in one query
        $progressMap = LessonProgress::where('user_id', $userId)
            ->whereIn('lesson_id', $lessonIds)
            ->get()
            ->keyBy('lesson_id');

        $totalLessons   = $course->lessons->count();
        $completedCount = $progressMap->filter(fn ($p) => $p->isCompleted())->count();
        $courseProgress = $totalLessons > 0
            ? (int) round(($completedCount / $totalLessons) * 100)
            : 0;

        $lessons = $course->lessons->map(function ($lesson) use ($progressMap) {
            $p = $progressMap->get($lesson->id);
            return [
                'id'                  => $lesson->id,
                'title'               => $lesson->title,
                'slug'                => $lesson->slug,
                'lesson_order'        => $lesson->lesson_order,
                'estimated_minutes'   => $lesson->estimated_minutes,
                'progress_percentage' => $p?->progress_percentage ?? 0,
                'is_completed'        => $p?->isCompleted() ?? false,
                'last_accessed_at'    => $p?->last_accessed_at,
            ];
        });

        return response()->json([
            'course_title'      => $course->title,
            'course_slug'       => $course->slug,
            'total_lessons'     => $totalLessons,
            'completed_lessons' => $completedCount,
            'course_progress'   => $courseProgress,
            'lessons'           => $lessons,
        ]);
    }
}
