<?php

namespace App\Http\Controllers\Api;

use App\Models\Course;
use App\Models\LibraryArticle;
use App\Models\Lesson;
use App\Models\ProgrammingLanguage;
use App\Models\Quiz;
use App\Models\QuizOption;
use App\Models\QuizQuestion;
use App\Models\User;
use App\Models\QuizAttempt;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminController
{
    private array $models = [
        'languages' => ProgrammingLanguage::class,
        'courses' => Course::class,
        'lessons' => Lesson::class,
        'articles' => LibraryArticle::class,
        'quizzes' => Quiz::class,
        'questions' => QuizQuestion::class,
        'options' => QuizOption::class,
    ];

    public function dashboard()
    {
        return response()->json(['data' => [
            'users' => User::count(), 'languages' => ProgrammingLanguage::count(), 'courses' => Course::count(),
            'lessons' => Lesson::count(), 'articles' => LibraryArticle::count(), 'quizzes' => Quiz::count(), 'quiz_attempts' => QuizAttempt::count(),
        ]]);
    }

    public function users(Request $request)
    {
        $users = User::query()->latest()->paginate(25, ['id', 'name', 'email', 'role', 'created_at']);
        return response()->json(['data' => $users->items(), 'pagination' => ['current_page' => $users->currentPage(), 'last_page' => $users->lastPage(), 'total' => $users->total()]]);
    }

    public function updateUserRole(Request $request, User $user)
    {
        $validated = $request->validate(['role' => ['required', Rule::in(['user', 'admin'])]]);
        abort_if($user->is($request->user()) && $validated['role'] !== 'admin', 422, 'You cannot remove your own administrator access.');
        $user->forceFill(['role' => $validated['role']])->save();
        return response()->json(['data' => ['id' => $user->id, 'role' => $user->role]]);
    }

    public function index(string $resource)
    {
        $model = $this->model($resource);
        $query = $model::query();
        if ($resource === 'courses') $query->with('programmingLanguage:id,name');
        if ($resource === 'lessons') $query->with('course:id,title');
        if ($resource === 'articles') $query->with('category:id,name');
        if ($resource === 'quizzes') $query->withCount('questions');
        if ($resource === 'questions') $query->with('quiz:id,title');
        if ($resource === 'options') $query->with('question:id,question');
        return response()->json(['data' => $query->latest()->paginate(25)]);
    }

    public function store(Request $request, string $resource)
    {
        $model = $this->model($resource);
        $item = $model::create($request->validate($this->rules($resource)));
        return response()->json(['data' => $item], 201);
    }

    public function update(Request $request, string $resource, int $id)
    {
        $model = $this->model($resource);
        $item = $model::findOrFail($id);
        $item->update($request->validate($this->rules($resource, true)));
        return response()->json(['data' => $item->fresh()]);
    }

    public function destroy(string $resource, int $id)
    {
        $model = $this->model($resource);
        $item = $model::findOrFail($id);
        $item->delete();
        return response()->noContent();
    }

    private function model(string $resource): string
    {
        abort_unless(isset($this->models[$resource]), 404);
        return $this->models[$resource];
    }

    private function rules(string $resource, bool $update = false): array
    {
        $required = $update ? 'sometimes' : 'required';
        return match ($resource) {
            'languages' => ['name' => [$required, 'string', 'max:255'], 'slug' => [$required, 'string', 'max:255'], 'description' => ['nullable', 'string']],
            'courses' => ['programming_language_id' => [$required, 'integer', 'exists:programming_languages,id'], 'title' => [$required, 'string', 'max:255'], 'slug' => [$required, 'string', 'max:255'], 'description' => ['nullable', 'string'], 'thumbnail' => ['nullable', 'string', 'max:255'], 'level' => [$required, 'string', 'max:50'], 'estimated_duration' => ['nullable', 'string', 'max:100']],
            'lessons' => ['course_id' => [$required, 'integer', 'exists:courses,id'], 'title' => [$required, 'string', 'max:255'], 'slug' => [$required, 'string', 'max:255'], 'description' => ['nullable', 'string'], 'content' => [$required, 'string'], 'lesson_order' => [$required, 'integer', 'min:1'], 'estimated_minutes' => [$required, 'integer', 'min:1']],
            'articles' => ['category_id' => [$required, 'integer', 'exists:library_categories,id'], 'title' => [$required, 'string', 'max:255'], 'slug' => [$required, 'string', 'max:255'], 'summary' => ['nullable', 'string'], 'content' => [$required, 'string']],
            'quizzes' => ['course_id' => ['nullable', 'integer', 'exists:courses,id'], 'lesson_id' => ['nullable', 'integer', 'exists:lessons,id'], 'title' => [$required, 'string', 'max:255'], 'description' => ['nullable', 'string'], 'passing_score' => [$required, 'integer', 'min:0', 'max:100']],
            'questions' => ['quiz_id' => [$required, 'integer', 'exists:quizzes,id'], 'question' => [$required, 'string'], 'question_type' => [$required, Rule::in(['multiple_choice'])], 'question_order' => [$required, 'integer', 'min:1'], 'points' => [$required, 'integer', 'min:1']],
                'questions' => ['quiz_id' => [$required, 'integer', 'exists:quizzes,id'], 'question' => [$required, 'string'], 'explanation' => ['nullable', 'string'], 'question_type' => [$required, Rule::in(['multiple_choice'])], 'question_order' => [$required, 'integer', 'min:1'], 'points' => [$required, 'integer', 'min:1']],
            'options' => ['question_id' => [$required, 'integer', 'exists:quiz_questions,id'], 'option_text' => [$required, 'string', 'max:255'], 'is_correct' => [$required, 'boolean'], 'option_order' => [$required, 'integer', 'min:1']],
        };
    }
}
