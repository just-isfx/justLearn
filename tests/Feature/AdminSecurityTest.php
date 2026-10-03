<?php

namespace Tests\Feature;

use App\Models\ProgrammingLanguage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_normal_users_cannot_access_admin_api(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'user']))
            ->getJson('/api/admin/dashboard')->assertForbidden();
    }

    public function test_admin_can_manage_content(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']))
            ->postJson('/api/admin/languages', ['name' => 'Ruby', 'slug' => 'ruby', 'description' => 'Ruby'])
            ->assertCreated();
        $language = ProgrammingLanguage::where('slug', 'ruby')->firstOrFail();
        $this->assertSame('Ruby', $language->name);
        $this->actingAs(User::factory()->create(['role' => 'admin']))
            ->deleteJson('/api/admin/languages/' . $language->id)->assertNoContent();
    }

    public function test_registration_cannot_assign_admin_role_and_picture_upload_is_validated(): void
    {
        $response = $this->postJson('/api/register', ['name' => 'User', 'email' => 'user@example.com', 'password' => 'secret123', 'password_confirmation' => 'secret123', 'role' => 'admin']);
        $response->assertCreated()->assertJsonPath('user.role', 'user');
        Storage::fake('public');
        $this->actingAs(User::factory()->create())->postJson('/api/profile/picture', ['profile_picture' => UploadedFile::fake()->create('not-image.txt', 10, 'text/plain')])->assertStatus(422);
    }
}
