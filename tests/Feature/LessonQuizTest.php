<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Lesson;
use App\Models\ProgrammingLanguage;
use App\Models\Quiz;
use App\Models\QuizOption;
use App\Models\QuizQuestion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LessonQuizTest extends TestCase
{
    use RefreshDatabase;

    public function test_lesson_quiz_returns_five_random_questions_without_correct_answers(): void
    {
        [$lesson, $quiz] = $this->makeLessonQuiz();
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson("/api/lessons/{$lesson->id}/quiz");

        $response->assertOk()->assertJsonCount(5, 'data.questions');
        $questionIds = collect($response->json('data.questions'))->pluck('id');
        $this->assertCount(5, $questionIds->unique());
        $this->assertArrayNotHasKey('is_correct', $response->json('data.questions.0.options.0'));
    }

    public function test_submitting_a_passing_lesson_quiz_does_not_bypass_reading_completion_requirements(): void
    {
        [$lesson, $quiz, $questions] = $this->makeLessonQuiz();
        $user = User::factory()->create();
        $answers = $questions->take(5)->map(fn ($question, $index) => [
            'question_id' => $question->id,
            'selected_option_id' => $question->options->firstWhere('is_correct', $index < 3)?->id,
        ])->all();

        $response = $this->actingAs($user)->postJson("/api/lessons/{$lesson->id}/quiz/submit", [
            'answers' => $answers,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.score', 60)
            ->assertJsonPath('data.passed', true)
            ->assertJsonPath('data.completed', false)
            ->assertJsonCount(2, 'data.incorrect_questions');

        $this->assertDatabaseHas('lesson_progress', [
            'user_id' => $user->id,
            'lesson_id' => $lesson->id,
            'last_score' => 60,
            'completed_at' => null,
        ]);
        $this->assertDatabaseHas('quiz_attempts', ['user_id' => $user->id, 'quiz_id' => $quiz->id]);
    }

    public function test_failing_a_lesson_quiz_saves_score_without_completing_the_lesson(): void
    {
        [$lesson, , $questions] = $this->makeLessonQuiz();
        $user = User::factory()->create();
        $answers = $questions->take(5)->map(fn ($question, $index) => [
            'question_id' => $question->id,
            'selected_option_id' => $question->options->firstWhere('is_correct', $index < 2)?->id
                ?? $question->options->firstWhere('option_order', 2)->id,
        ])->all();

        $this->actingAs($user)->postJson("/api/lessons/{$lesson->id}/quiz/submit", [
            'answers' => $answers,
        ])->assertCreated()
            ->assertJsonPath('data.score', 40)
            ->assertJsonPath('data.passed', false)
            ->assertJsonCount(3, 'data.incorrect_questions');

        $progress = $user->lessonProgress()->where('lesson_id', $lesson->id)->firstOrFail();
        $this->assertSame(40, $progress->last_score);
        $this->assertNull($progress->completed_at);
    }

    public function test_continue_course_returns_first_incomplete_lesson(): void
    {
        [$lesson, , , $course] = $this->makeLessonQuiz();
        $laterLesson = Lesson::create([
            'course_id' => $course->id,
            'title' => 'Second lesson',
            'slug' => 'second-lesson',
            'content' => 'Lesson body',
            'lesson_order' => 2,
            'estimated_minutes' => 5,
        ]);
        $user = User::factory()->create();
        $user->lessonProgress()->create([
            'lesson_id' => $lesson->id,
            'progress_percentage' => 100,
            'completed_at' => now(),
        ]);

        $this->actingAs($user)->getJson("/api/courses/{$course->id}/continue")
            ->assertOk()
            ->assertJsonPath('data.lesson.id', $laterLesson->id);

        $newUser = User::factory()->create();
        $this->actingAs($newUser)->getJson("/api/courses/{$course->id}/continue")
            ->assertOk()
            ->assertJsonPath('data.lesson.id', $lesson->id);
    }

    private function makeLessonQuiz(): array
    {
        $language = ProgrammingLanguage::create(['name' => 'PHP', 'slug' => 'php', 'description' => 'PHP']);
        $course = Course::create([
            'programming_language_id' => $language->id,
            'title' => 'PHP Basics',
            'slug' => 'php-basics',
            'description' => 'PHP basics',
            'level' => 'Beginner',
            'estimated_duration' => '2 weeks',
        ]);
        $lesson = Lesson::create([
            'course_id' => $course->id,
            'title' => 'Variables',
            'slug' => 'variables',
            'content' => 'Lesson body',
            'lesson_order' => 1,
            'estimated_minutes' => 5,
        ]);
        $quiz = Quiz::create([
            'course_id' => $course->id,
            'lesson_id' => $lesson->id,
            'title' => 'Variables check',
            'passing_score' => 50,
        ]);
        $questions = collect(range(1, 10))->map(function ($number) use ($quiz) {
            $question = QuizQuestion::create([
                'quiz_id' => $quiz->id,
                'question' => "Question {$number}?",
                'question_type' => 'multiple_choice',
                'question_order' => $number,
                'points' => 1,
                'explanation' => 'The first option is correct.',
            ]);
            foreach (range(1, 4) as $optionOrder) {
                QuizOption::create([
                    'question_id' => $question->id,
                    'option_text' => "Option {$optionOrder}",
                    'is_correct' => $optionOrder === 1,
                    'option_order' => $optionOrder,
                ]);
            }
            return $question->load('options');
        });

        return [$lesson, $quiz, $questions, $course];
    }
}