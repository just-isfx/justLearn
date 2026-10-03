<?php

namespace Tests\Feature;

use App\Models\Achievement;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\Notification;
use App\Models\ProgrammingLanguage;
use App\Models\User;
use App\Services\LearningActivityService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class EngagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_completing_a_lesson_unlocks_an_achievement_and_creates_notification(): void
    {
        $user = User::factory()->create();
        $achievement = Achievement::create(['name' => 'First Lesson', 'slug' => 'first-lesson', 'description' => 'Complete one lesson.', 'requirement_type' => 'lessons_completed', 'requirement_value' => 1]);
        $language = ProgrammingLanguage::create(['name' => 'PHP', 'slug' => 'php-test', 'description' => 'PHP']);
        $course = Course::create(['programming_language_id' => $language->id, 'title' => 'PHP', 'slug' => 'php-test', 'description' => 'PHP', 'level' => 'Beginner', 'estimated_duration' => '1 week']);
        $lesson = Lesson::create(['course_id' => $course->id, 'title' => 'Intro', 'slug' => 'intro-test', 'description' => 'Intro', 'content' => '<p>Learn</p>', 'lesson_order' => 1, 'estimated_minutes' => 5]);

        $this->actingAs($user)->postJson('/api/lessons/' . $lesson->id . '/progress', ['progress_percentage' => 100, 'time_spent_seconds' => 60])->assertOk();

        $this->assertDatabaseHas('user_achievements', ['user_id' => $user->id, 'achievement_id' => $achievement->id]);
        $this->assertDatabaseHas('notifications', ['user_id' => $user->id, 'type' => 'lesson_completed']);
    }

    public function test_streak_increments_on_consecutive_days_and_preserves_longest(): void
    {
        $user = User::factory()->create();
        $service = app(LearningActivityService::class);
        Carbon::setTestNow('2026-08-26 12:00:00');
        $service->record($user, 'lesson_progress');
        Carbon::setTestNow('2026-08-27 12:00:00');
        $service->record($user->fresh(), 'quiz_completed');
        Carbon::setTestNow('2026-08-29 12:00:00');
        $streak = $service->record($user->fresh(), 'lesson_progress');

        $this->assertSame(1, $streak->current_streak);
        $this->assertSame(2, $streak->longest_streak);
        Carbon::setTestNow();
    }

    public function test_notifications_are_private_and_read_state_persists(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $notification = Notification::create(['user_id' => $owner->id, 'type' => 'test', 'title' => 'Test', 'message' => 'Message']);

        $this->actingAs($other)->getJson('/api/notifications')->assertOk()->assertJsonCount(0, 'data');
        $this->actingAs($owner)->putJson('/api/notifications/' . $notification->id . '/read')->assertOk();
        $this->assertNotNull(DB::table('notifications')->where('id', $notification->id)->value('read_at'));
        $this->actingAs($other)->putJson('/api/notifications/' . $notification->id . '/read')->assertNotFound();
    }
}
