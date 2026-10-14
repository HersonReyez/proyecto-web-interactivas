<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withHeader('Origin', 'http://localhost:5173');
    }

    public function test_guests_cannot_read_private_data(): void
    {
        $this->getJson('/api/me')->assertUnauthorized();
        $this->getJson('/api/users')->assertUnauthorized();
        $this->putJson('/api/profile', [])->assertUnauthorized();
        $this->get('/api/users')->assertUnauthorized()->assertHeader('Content-Type', 'application/json');
    }

    public function test_malformed_login_and_requests_without_a_spa_origin_are_rejected(): void
    {
        $this->postJson('/api/login', ['email' => ['invalid'], 'password' => 'password'])
            ->assertUnprocessable()->assertJsonValidationErrors('email');
        $this->withoutHeader('Origin')->postJson('/api/register', [
            'name' => 'No session', 'email' => 'no-session@example.com',
            'password' => 'password123', 'password_confirmation' => 'password123',
        ])->assertForbidden();
        $this->assertDatabaseCount('users', 0);
    }

    public function test_registration_always_creates_a_client_and_starts_a_session(): void
    {
        $this->postJson('/api/register', [
            'name' => 'Nueva Persona',
            'email' => 'NUEVA@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'admin',
        ])->assertCreated()->assertJsonPath('user.role', 'cliente')
            ->assertJsonPath('user.email', 'nueva@example.com')
            ->assertJsonMissingPath('user.password')->assertJsonMissingPath('access_token');

        $this->getJson('/api/me')->assertOk()->assertJsonPath('user.name', 'Nueva Persona');
        $this->assertTrue(Hash::check('password123', User::first()->password));
    }

    public function test_registration_validates_unique_email_and_password_confirmation(): void
    {
        User::factory()->create(['email' => 'existing@example.com']);
        $this->postJson('/api/register', [
            'name' => 'Persona',
            'email' => 'existing@example.com',
            'password' => 'password123',
            'password_confirmation' => 'different',
        ])->assertUnprocessable()->assertJsonValidationErrors(['email', 'password']);
        $this->assertDatabaseCount('users', 1);
    }

    public function test_login_me_and_logout_use_a_session(): void
    {
        $user = User::factory()->create(['role' => 'admin']);
        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'password'])
            ->assertOk()->assertJsonPath('user.role', 'admin')->assertJsonMissingPath('user.password');
        $this->getJson('/api/me')->assertOk()->assertJsonPath('user.id', $user->id);
        $this->postJson('/api/logout')->assertOk();
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/me')->assertUnauthorized();
    }

    public function test_invalid_login_and_repeated_attempts_are_rejected(): void
    {
        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->postJson('/api/login', ['email' => 'nobody@example.com', 'password' => 'wrong'])
                ->assertUnprocessable()->assertJsonValidationErrors('email');
        }
        $this->postJson('/api/login', ['email' => 'nobody@example.com', 'password' => 'wrong'])->assertTooManyRequests();
    }

    public function test_profile_cannot_change_role_and_sensitive_changes_require_current_password(): void
    {
        $user = User::factory()->create(['role' => 'cliente']);
        $this->actingAs($user)->putJson('/api/profile', [
            'name' => 'Nombre nuevo', 'email' => $user->email, 'role' => 'admin',
        ])->assertOk()->assertJsonPath('user.role', 'cliente');
        $this->putJson('/api/profile', [
            'name' => 'Nombre nuevo', 'email' => 'changed@example.com',
        ])->assertUnprocessable()->assertJsonValidationErrors('current_password');
        $this->putJson('/api/profile', [
            'name' => 'Nombre nuevo', 'email' => 'changed@example.com',
            'current_password' => 'wrong',
        ])->assertUnprocessable()->assertJsonValidationErrors('current_password');
    }

    public function test_profile_updates_email_and_password_with_valid_credentials(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user)->putJson('/api/profile', [
            'name' => 'Nombre nuevo', 'email' => 'changed@example.com',
            'current_password' => 'password',
            'password' => 'newpassword123', 'password_confirmation' => 'newpassword123',
        ])->assertOk()->assertJsonPath('user.email', 'changed@example.com')->assertJsonPath('user.email_verified_at', null);
        $this->assertTrue(Hash::check('newpassword123', $user->fresh()->password));
    }

    public function test_backend_root_is_json_not_a_blade_view(): void
    {
        $this->get('/')->assertOk()->assertJsonPath('name', 'Anime Store API');
    }
}
