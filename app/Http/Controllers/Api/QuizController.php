<?php

namespace App\Http\Controllers\Api;

use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\Lesson;
use App\Models\LessonProgress;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Services\LearningActivityService;

class QuizController
{
    public function lessonQuiz(int $lessonId)
    {
        $lesson = Lesson::findOrFail($lessonId);
        $quiz = $lesson->quizzes()
            ->whereHas('questions', fn ($query) => $query->where('question_type', 'multiple_choice'))
            ->orderBy('id')
            ->firstOrFail();

        $questions = $quiz->questions()
            ->where('question_type', 'multiple_choice')
            ->with(['options' => fn ($query) => $query->orderBy('option_order')->select('id', 'question_id', 'option_text', 'option_order')])
            ->inRandomOrder()
            ->limit(5)
            ->get();

        if ($questions->count() < 5) {
            return response()->json(['message' => 'This lesson needs at least five multiple-choice questions.'], 422);
        }

        return response()->json(['data' => [
            'quiz_id' => $quiz->id,
            'title' => $quiz->title,
            'questions' => $questions->values()->map(fn ($question) => [
                'id' => $question->id,
                'question' => $question->question,
                'options' => $question->options->values()->map(fn ($option, $index) => [
                    'id' => $option->id,
                    'label' => chr(65 + $index),
                    'text' => $option->option_text,
                ]),
            ]),
        ]]);
    }

    public function submitLessonQuiz(int $lessonId, Request $request, LearningActivityService $activity)
    {
        $validated = $request->validate([
            'answers' => ['required', 'array', 'size:5'],
            'answers.*.question_id' => ['required', 'integer', 'distinct'],
            'answers.*.selected_option_id' => ['required', 'nullable', 'integer'],
        ]);

        $lesson = Lesson::findOrFail($lessonId);
        $questionIds = collect($validated['answers'])->pluck('question_id');
        $questions = $lesson->quizzes()
            ->whereHas('questions', fn ($query) => $query->where('question_type', 'multiple_choice'))
            ->orderBy('id')
            ->firstOrFail()
            ->questions()
            ->whereIn('id', $questionIds)
            ->where('question_type', 'multiple_choice')
            ->with('options')
            ->get()
            ->keyBy('id');

        if ($questions->count() !== 5) {
            return response()->json(['message' => 'One or more questions do not belong to this lesson quiz.'], 422);
        }

        foreach ($validated['answers'] as $answer) {
            $question = $questions->get($answer['question_id']);
            if ($answer['selected_option_id'] !== null
                && ! $question->options->contains('id', $answer['selected_option_id'])) {
                return response()->json(['message' => 'One or more selected answers are invalid.'], 422);
            }
        }

        $result = DB::transaction(function () use ($request, $lesson, $questions, $validated) {
            $quiz = $questions->first()->quiz;
            $correctCount = 0;
            $answerRows = [];
            $incorrect = [];

            foreach ($validated['answers'] as $answer) {
                $question = $questions->get($answer['question_id']);
                $selected = $question->options->firstWhere('id', $answer['selected_option_id']);
                $correctOption = $question->options->firstWhere('is_correct', true);
                $isCorrect = $selected && $correctOption && $selected->id === $correctOption->id;
                $correctCount += (int) $isCorrect;

                $answerRows[] = [
                    'question_id' => $question->id,
                    'selected_option_id' => $selected?->id,
                    'is_correct' => $isCorrect,
                    'points_earned' => (int) $isCorrect,
                ];

                if (! $isCorrect) {
                    $correctIndex = $question->options->search(fn ($option) => $option->id === $correctOption?->id);
                    $incorrect[] = [
                        'question_id' => $question->id,
                        'question' => $question->question,
                        'selected_answer' => $selected?->option_text,
                        'correct_answer' => $correctOption?->option_text,
                        'correct_option' => $correctIndex === false ? null : chr(65 + $correctIndex),
                        'explanation' => $question->explanation,
                    ];
                }
            }

            $percentage = (int) round(($correctCount / 5) * 100);
            $passed = $percentage >= 50;
            $attempt = $quiz->attempts()->create([
                'user_id' => $request->user()->id,
                'score' => $correctCount,
                'total_points' => 5,
                'percentage' => $percentage,
                'passed' => $passed,
                'started_at' => now(),
                'completed_at' => now(),
            ]);
            $attempt->answers()->createMany($answerRows);

            $progress = LessonProgress::firstOrNew([
                'user_id' => $request->user()->id,
                'lesson_id' => $lesson->id,
            ]);
            $progress->last_score = $percentage;
            $progress->last_accessed_at = now();
            $progress->save();

            return compact('attempt', 'percentage', 'passed', 'incorrect', 'progress');
        });

        $activity->record($request->user(), 'quiz_completed');
        $request->user()->notifications()->create([
            'type' => 'quiz_completed',
            'title' => $result['passed'] ? 'Quiz passed' : 'Quiz completed',
            'message' => 'You scored ' . $result['percentage'] . '% on ' . $lesson->title . '.',
        ]);

        return response()->json(['data' => [
            'attempt_id' => $result['attempt']->id,
            'score' => $result['percentage'],
            'passed' => $result['passed'],
            'completed' => $result['progress']->isCompleted(),
            'incorrect_questions' => $result['incorrect'],
        ]], 201);
    }

    public function index(Request $request)
    {
        $quizzes = Quiz::with(['course:id,title,slug', 'lesson:id,title,slug'])
            ->withCount('questions')
            ->orderBy('title')
            ->get()
            ->map(fn (Quiz $quiz) => $this->quizSummary($quiz, $request->user()->id));

        return response()->json(['data' => $quizzes]);
    }

    public function show(Quiz $quiz, Request $request)
    {
        $quiz->load(['course:id,title,slug', 'lesson:id,title,slug', 'questions.options'])->loadCount('questions');

        return response()->json(['data' => $this->quizPayload($quiz, $request->user()->id)]);
    }

    public function submit(Quiz $quiz, Request $request, LearningActivityService $activity)
    {
        $validated = $request->validate([
            'answers' => ['required', 'array'],
            'answers.*.question_id' => ['required', 'integer', 'distinct'],
            'answers.*.selected_option_id' => ['nullable', 'integer'],
        ]);

        $quiz->load('questions.options');
        $questions = $quiz->questions->keyBy('id');
        $answersByQuestion = collect($validated['answers'])->keyBy('question_id');

        foreach ($answersByQuestion as $questionId => $answer) {
            $question = $questions->get($questionId);
            if (! $question) {
                return response()->json(['message' => 'One or more questions do not belong to this quiz.'], 422);
            }

            if ($answer['selected_option_id'] !== null
                && ! $question->options->contains('id', $answer['selected_option_id'])) {
                return response()->json(['message' => 'One or more selected options are invalid for their questions.'], 422);
            }
        }

        $attempt = DB::transaction(function () use ($request, $quiz, $questions, $answersByQuestion) {
            $totalPoints = (int) $questions->sum('points');
            $score = 0;
            $answerRows = [];

            foreach ($questions as $question) {
                $selectedId = $answersByQuestion->get($question->id)['selected_option_id'] ?? null;
                $selected = $selectedId ? $question->options->firstWhere('id', $selectedId) : null;
                $correct = (bool) ($selected?->is_correct);
                $points = $correct ? (int) $question->points : 0;
                $score += $points;
                $answerRows[] = [
                    'question_id' => $question->id,
                    'selected_option_id' => $selected?->id,
                    'is_correct' => $correct,
                    'points_earned' => $points,
                ];
            }

            $percentage = $totalPoints > 0 ? round(($score / $totalPoints) * 100, 2) : 0;
            $attempt = $quiz->attempts()->create([
                'user_id' => $request->user()->id,
                'score' => $score,
                'total_points' => $totalPoints,
                'percentage' => $percentage,
                'passed' => $percentage >= $quiz->passing_score,
                'started_at' => now(),
                'completed_at' => now(),
            ]);
            $attempt->answers()->createMany($answerRows);

            return $attempt;
        });
        $activity->record($request->user(), 'quiz_completed');
        $request->user()->notifications()->create([
            'type' => 'quiz_completed',
            'title' => $attempt->passed ? 'Quiz passed' : 'Quiz completed',
            'message' => 'You scored ' . $attempt->percentage . '% on ' . $quiz->title . '.',
        ]);

        return response()->json(['data' => $this->attemptPayload($attempt->load([
            'quiz', 'answers.question.options', 'answers.selectedOption',
        ]))], 201);
    }

    public function attempts(Request $request)
    {
        $attempts = QuizAttempt::with('quiz:id,title,passing_score')
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json(['data' => $attempts->map(fn (QuizAttempt $attempt) => $this->attemptSummary($attempt))]);
    }

    public function showAttempt(QuizAttempt $attempt, Request $request)
    {
        abort_unless($attempt->user_id === $request->user()->id, 404);

        return response()->json(['data' => $this->attemptPayload($attempt->load([
            'quiz', 'answers.question.options', 'answers.selectedOption',
        ]))]);
    }

    private function quizSummary(Quiz $quiz, int $userId): array
    {
        $attempts = $quiz->attempts()->where('user_id', $userId);
        return [
            'id' => $quiz->id, 'title' => $quiz->title, 'description' => $quiz->description,
            'passing_score' => $quiz->passing_score, 'questions_count' => $quiz->questions_count,
            'course' => $quiz->course, 'lesson' => $quiz->lesson,
            'attempts_count' => (clone $attempts)->count(),
            'best_percentage' => (clone $attempts)->max('percentage'),
        ];
    }

    private function quizPayload(Quiz $quiz, int $userId): array
    {
        $payload = $this->quizSummary($quiz, $userId);
        $payload['questions'] = $quiz->questions->map(fn ($question) => [
            'id' => $question->id,
            'question' => $question->question,
            'question_type' => $question->question_type,
            'question_order' => $question->question_order,
            'points' => $question->points,
            'options' => $question->options->map(fn ($option) => [
                'id' => $option->id,
                'option_text' => $option->option_text,
                'option_order' => $option->option_order,
            ]),
        ]);
        return $payload;
    }

    private function attemptSummary(QuizAttempt $attempt): array
    {
        return [
            'id' => $attempt->id, 'quiz' => $attempt->quiz, 'score' => $attempt->score,
            'total_points' => $attempt->total_points, 'percentage' => $attempt->percentage,
            'passed' => $attempt->passed, 'completed_at' => $attempt->completed_at,
        ];
    }

    private function attemptPayload(QuizAttempt $attempt): array
    {
        return [
            ...$this->attemptSummary($attempt),
            'answers' => $attempt->answers->sortBy('question.question_order')->values()->map(fn ($answer) => [
                'question_id' => $answer->question_id,
                'question' => $answer->question->question,
                'selected_option_id' => $answer->selected_option_id,
                'selected_answer' => $answer->selectedOption?->option_text,
                'correct_option_id' => $answer->question->options->firstWhere('is_correct', true)?->id,
                'correct_answer' => $answer->question->options->firstWhere('is_correct', true)?->option_text,
                'is_correct' => $answer->is_correct,
                'points_earned' => $answer->points_earned,
            ]),
        ];
    }
}
