<?php

namespace Tests\Feature;

use App\Models\Lesson;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LanguagePreferenceTest extends TestCase
{
    use RefreshDatabase;

    public function test_new_users_default_to_english(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Ada Lovelace',
            'email' => 'ada-lang@example.com',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('user.preferred_language', 'en')
            ->assertJsonPath('user.speech_rate', 1);

        $this->assertDatabaseHas('users', [
            'email' => 'ada-lang@example.com',
            'preferred_language' => 'en',
        ]);
    }

    public function test_authenticated_user_can_update_language_preference(): void
    {
        $user = User::factory()->create(['preferred_language' => 'en']);

        $this->actingAs($user);

        $response = $this->putJson('/api/user/language', ['language' => 'fr']);

        $response->assertStatus(200)
            ->assertJsonPath('user.preferred_language', 'fr')
            ->assertJsonPath('user.id', $user->id);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'preferred_language' => 'fr',
        ]);
    }

    public function test_language_preference_persists_on_me_endpoint(): void
    {
        $user = User::factory()->create(['preferred_language' => 'es']);

        $this->actingAs($user);

        $this->getJson('/api/me')
            ->assertStatus(200)
            ->assertJsonPath('user.preferred_language', 'es');
    }

    public function test_invalid_language_codes_are_rejected(): void
    {
        $user = User::factory()->create(['preferred_language' => 'en']);

        $this->actingAs($user);

        $this->putJson('/api/user/language', ['language' => 'de'])
            ->assertStatus(422);

        $this->putJson('/api/user/language', ['language' => 'not-a-language'])
            ->assertStatus(422);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'preferred_language' => 'en',
        ]);
    }

    public function test_guests_cannot_update_language_preference(): void
    {
        $this->putJson('/api/user/language', ['language' => 'fr'])
            ->assertStatus(401);
    }

    public function test_users_cannot_modify_another_users_language_via_payload(): void
    {
        $alice = User::factory()->create(['preferred_language' => 'en']);
        $bob = User::factory()->create(['preferred_language' => 'en']);

        $this->actingAs($alice);

        $this->putJson('/api/user/language', [
            'language' => 'fr',
            'user_id' => $bob->id,
            'id' => $bob->id,
        ])->assertStatus(200)
            ->assertJsonPath('user.id', $alice->id)
            ->assertJsonPath('user.preferred_language', 'fr');

        $this->assertDatabaseHas('users', [
            'id' => $alice->id,
            'preferred_language' => 'fr',
        ]);
        $this->assertDatabaseHas('users', [
            'id' => $bob->id,
            'preferred_language' => 'en',
        ]);
    }

    public function test_speech_rate_is_validated_and_saved(): void
    {
        $user = User::factory()->create(['speech_rate' => 1.0]);

        $this->actingAs($user);

        $this->putJson('/api/user/speech-settings', ['speech_rate' => 1.5])
            ->assertStatus(200)
            ->assertJsonPath('user.speech_rate', 1.5);

        $this->putJson('/api/user/speech-settings', ['speech_rate' => 9])
            ->assertStatus(422);
    }

    public function test_content_translations_can_be_attached_without_duplicating_lessons(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $language = \App\Models\ProgrammingLanguage::create([
            'name' => 'JavaScript',
            'slug' => 'javascript-i18n',
            'description' => 'JS',
        ]);
        $course = \App\Models\Course::create([
            'programming_language_id' => $language->id,
            'title' => 'JS Basics',
            'slug' => 'js-basics-i18n',
            'description' => 'Learn JS',
            'level' => 'Beginner',
            'estimated_duration' => '1 week',
        ]);
        $lesson = Lesson::create([
            'course_id' => $course->id,
            'title' => 'Intro',
            'slug' => 'intro-i18n',
            'description' => 'Getting started',
            'content' => '<p>Hello</p>',
            'lesson_order' => 1,
            'estimated_minutes' => 5,
        ]);

        $lesson->translations()->create([
            'locale' => 'fr',
            'title' => 'Introduction',
            'description' => 'Pour commencer',
            'content' => '<p>Bonjour</p>',
        ]);

        $this->assertDatabaseHas('content_translations', [
            'locale' => 'fr',
            'title' => 'Introduction',
            'translatable_id' => $lesson->id,
        ]);

        $localized = $lesson->fresh()->toLocalizedArray('fr');
        $this->assertSame('Introduction', $localized['title']);
        $this->assertSame('<p>Bonjour</p>', $localized['content']);
        $this->assertTrue($localized['is_translated']);

        $english = $lesson->fresh()->toLocalizedArray('en');
        $this->assertSame('Intro', $english['title']);
        $this->assertFalse($english['is_translated']);
    }
}
