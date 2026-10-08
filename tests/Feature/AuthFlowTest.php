<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithoutMiddleware;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class AuthFlowTest extends TestCase
{
    use RefreshDatabase, WithoutMiddleware;

    public function test_csrf_token_refresh_endpoint_returns_the_current_session_token(): void
    {
        $response = $this->getJson('/csrf-token');

        $response->assertOk()
            ->assertJsonStructure(['token']);
        $this->assertSame(csrf_token(), $response->json('token'));
    }

    public function test_users_can_register_and_be_authenticated(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Ada Lovelace',
            'email' => 'ada@example.com',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('user.name', 'Ada Lovelace')
            ->assertJsonPath('user.email', 'ada@example.com')
            ->assertJsonPath('user.theme_preference', 'light');

        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', ['email' => 'ada@example.com']);
    }

    public function test_authenticated_users_can_update_their_profile_and_password(): void
    {
        $user = User::factory()->create([
            'name' => 'Grace Hopper',
            'email' => 'grace@example.com',
            'password' => 'old-password',
        ]);

        $this->actingAs($user);

        $profileResponse = $this->putJson('/api/profile', [
            'name' => 'Grace Updated',
            'email' => 'grace.updated@example.com',
        ]);

        $profileResponse->assertStatus(200)
            ->assertJsonPath('user.name', 'Grace Updated')
            ->assertJsonPath('user.email', 'grace.updated@example.com');

        $passwordResponse = $this->putJson('/api/password', [
            'current_password' => 'old-password',
            'password' => 'new-password-123',
            'password_confirmation' => 'new-password-123',
        ]);

        $passwordResponse->assertStatus(200)
            ->assertJsonPath('message', 'Password updated successfully.');

        $this->assertTrue(
            auth()->attempt(['email' => 'grace.updated@example.com', 'password' => 'new-password-123'])
        );
    }

    public function test_authenticated_users_can_update_theme_preference(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $this->putJson('/api/user/theme-preference', ['theme_preference' => 'dark'])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('theme_preference', 'dark')
            ->assertJsonPath('user.theme_preference', 'dark');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'theme_preference' => 'dark',
        ]);

        $this->putJson('/api/user/theme-preference', ['theme_preference' => 'sepia'])
            ->assertUnprocessable();

        $this->putJson('/api/user/theme-preference', ['theme_preference' => 'system'])
            ->assertUnprocessable();
    }

    public function test_legacy_theme_values_fall_back_to_light(): void
    {
        $user = User::factory()->create(['theme_preference' => 'system']);

        $this->assertSame('light', $user->toAuthArray()['theme_preference']);
    }

    public function test_forgot_password_uses_a_generic_response_and_sends_a_reset_notification(): void
    {
        Notification::fake();
        $user = User::factory()->create(['email' => 'reset@example.com']);

        $response = $this->postJson('/api/forgot-password', [
            'email' => $user->email,
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'If an account exists for that email, a password reset link has been sent.');

        Notification::assertSentTo($user, ResetPasswordNotification::class);
        $this->assertDatabaseHas('password_reset_tokens', ['email' => $user->email]);

        $unknownResponse = $this->postJson('/api/forgot-password', [
            'email' => 'missing@example.com',
        ]);

        $unknownResponse->assertOk()
            ->assertJsonPath('message', 'If an account exists for that email, a password reset link has been sent.');
    }

    public function test_password_reset_rejects_invalid_tokens_and_allows_login_after_success(): void
    {
        $user = User::factory()->create([
            'email' => 'reset-success@example.com',
            'password' => 'old-password',
        ]);

        $invalidResponse = $this->postJson('/api/reset-password', [
            'token' => 'invalid-token',
            'email' => $user->email,
            'password' => 'new-password-123',
            'password_confirmation' => 'new-password-123',
        ]);

        $invalidResponse->assertStatus(422)
            ->assertJsonPath('message', 'This password reset link is invalid or has expired.');

        $token = Password::broker()->createToken($user);
        $response = $this->postJson('/api/reset-password', [
            'token' => $token,
            'email' => $user->email,
            'password' => 'new-password-123',
            'password_confirmation' => 'new-password-123',
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'Your password has been reset successfully.');
        $this->assertTrue(Hash::check('new-password-123', $user->fresh()->password));
        $this->assertTrue(auth()->attempt(['email' => $user->email, 'password' => 'new-password-123']));
    }

    public function test_authenticated_users_can_upload_replace_and_delete_their_profile_picture(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();
        $this->actingAs($user);

        $firstResponse = $this->post('/api/profile/picture', [
            'profile_picture' => UploadedFile::fake()->image('first.jpg'),
        ]);

        $firstResponse->assertOk()->assertJsonPath('user.profile_picture_url', '/storage/' . $user->fresh()->profile_picture_path);
        $firstPath = $user->fresh()->profile_picture_path;
        Storage::disk('public')->assertExists($firstPath);

        $secondResponse = $this->post('/api/profile/picture', [
            'profile_picture' => UploadedFile::fake()->image('second.png'),
        ]);

        $secondResponse->assertOk();
        Storage::disk('public')->assertMissing($firstPath);
        Storage::disk('public')->assertExists($user->fresh()->profile_picture_path);

        $deleteResponse = $this->deleteJson('/api/profile/picture');

        $deleteResponse->assertOk()->assertJsonPath('user.profile_picture_url', null);
        $this->assertNull($user->fresh()->profile_picture_path);
    }

    public function test_profile_picture_upload_rejects_invalid_files(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->withHeader('Accept', 'application/json')->post('/api/profile/picture', [
            'profile_picture' => UploadedFile::fake()->create('document.txt', 10, 'text/plain'),
        ]);

        $response->assertStatus(422);
        $this->assertNull($user->fresh()->profile_picture_path);
    }
}
