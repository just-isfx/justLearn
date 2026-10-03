<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_returns_zeroed_data_when_no_lessons_or_progress_exist(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/api/my/dashboard');

        $response->assertOk()
            ->assertJsonPath('statistics.courses', 0)
            ->assertJsonPath('statistics.lessons_completed', 0)
            ->assertJsonPath('statistics.total_lessons', 0)
            ->assertJsonPath('statistics.learning_time_seconds', 0)
            ->assertJsonPath('statistics.overall_progress', 0)
            ->assertJsonPath('statistics.completion_percentage', 0)
            ->assertJsonPath('statistics.quizzes_taken', 0)
            ->assertJsonPath('statistics.quiz_average_score', 0)
            ->assertJsonPath('continue_learning', null)
            ->assertJsonCount(0, 'recent_activity')
            ->assertJsonCount(0, 'achievements');
    }
}