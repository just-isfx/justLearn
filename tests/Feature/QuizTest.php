<?php

namespace Tests\Feature;

use App\Models\Quiz;
use App\Models\QuizQuestion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuizTest extends TestCase
{
    use RefreshDatabase;

    private function makeQuiz(): Quiz
    {
        $quiz = Quiz::create(['title' => 'Basics', 'description' => 'Practice', 'passing_score' => 70]);
        $question = $quiz->questions()->create([
            'question' => 'What stores a value?', 'question_type' => 'multiple_choice', 'question_order' => 1, 'points' => 2,
        ]);
        $question->options()->createMany([
            ['option_text' => 'A variable', 'is_correct' => true, 'option_order' => 1],
            ['option_text' => 'A browser', 'is_correct' => false, 'option_order' => 2],
        ]);
        return $quiz->fresh('questions.options');
    }

    public function test_quiz_fetch_hides_correct_answers(): void
    {
        $this->actingAs(User::factory()->create());
        $quiz = $this->makeQuiz();

        $response = $this->getJson('/api/quizzes/' . $quiz->id)->assertOk();
        $response->assertJsonMissingPath('data.questions.0.options.0.is_correct');
    }

    public function test_server_scores_and_stores_an_attempt(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $quiz = $this->makeQuiz();
        $question = $quiz->questions->first();
        $correct = $question->options->firstWhere('is_correct', true);

        $response = $this->postJson('/api/quizzes/' . $quiz->id . '/attempts', [
            'answers' => [['question_id' => $question->id, 'selected_option_id' => $correct->id]],
            'score' => 0,
        ])->assertCreated()->assertJsonPath('data.percentage', 100);

        $this->assertDatabaseHas('quiz_attempts', ['user_id' => $user->id, 'score' => 2, 'passed' => 1]);
        $this->assertDatabaseHas('quiz_answers', ['attempt_id' => $response->json('data.id'), 'is_correct' => 1, 'points_earned' => 2]);
    }

    public function test_invalid_question_and_option_pairs_are_rejected(): void
    {
        $this->actingAs(User::factory()->create());
        $quiz = $this->makeQuiz();
        $otherQuiz = Quiz::create(['title' => 'Other', 'passing_score' => 70]);
        $otherQuestion = $otherQuiz->questions()->create(['question' => 'Other', 'question_order' => 1, 'points' => 1]);

        $this->postJson('/api/quizzes/' . $quiz->id . '/attempts', [
            'answers' => [['question_id' => $otherQuestion->id, 'selected_option_id' => null]],
        ])->assertStatus(422);
    }

    public function test_users_cannot_view_another_users_attempt(): void
    {
        $owner = User::factory()->create();
        $quiz = $this->makeQuiz();
        $this->actingAs($owner);
        $question = $quiz->questions->first();
        $option = $question->options->first();
        $attempt = $this->postJson('/api/quizzes/' . $quiz->id . '/attempts', [
            'answers' => [['question_id' => $question->id, 'selected_option_id' => $option->id]],
        ])->json('data.id');

        $this->actingAs(User::factory()->create())->getJson('/api/quiz-attempts/' . $attempt)->assertNotFound();
    }
}
