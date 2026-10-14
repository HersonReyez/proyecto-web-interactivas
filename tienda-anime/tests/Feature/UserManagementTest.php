<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withHeader('Origin', 'http://localhost:5173');
    }

    public function test_clients_cannot_access_any_user_management_action(): void
    {
        $client = User::factory()->create(['role' => 'cliente']);
        $other = User::factory()->create();
        $this->actingAs($client)->getJson('/api/users')->assertForbidden();
        $this->postJson('/api/users', [])->assertForbidden();
        $this->putJson('/api/users/'.$other->id, [])->assertForbidden();
        $this->deleteJson('/api/users/'.$other->id)->assertForbidden();
    }

    public function test_admin_can_search_filter_and_paginate_users_without_passwords(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        User::factory()->count(12)->create(['role' => 'cliente']);
        User::factory()->create(['name' => 'Persona Encontrable', 'role' => 'cliente']);
        $this->actingAs($admin)->getJson('/api/users')
            ->assertOk()->assertJsonCount(10, 'data')->assertJsonPath('total', 14)
            ->assertJsonPath('stats.admins', 1)->assertJsonMissingPath('data.0.password');
        $this->getJson('/api/users?search=Encontrable&role=cliente')
            ->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.name', 'Persona Encontrable');
        $this->getJson('/api/users?page=2')->assertOk()->assertJsonCount(4, 'data');
    }

    public function test_admin_can_create_edit_and_delete_a_user(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $response = $this->actingAs($admin)->postJson('/api/users', [
            'name' => 'Cuenta nueva', 'email' => 'new@example.com', 'role' => 'cliente',
            'password' => 'password123', 'password_confirmation' => 'password123',
        ])->assertCreated()->assertJsonMissingPath('user.password');
        $id = $response->json('user.id');
        $this->putJson('/api/users/'.$id, [
            'name' => 'Cuenta editada', 'email' => 'new@example.com', 'role' => 'admin', 'password' => '',
        ])->assertOk()->assertJsonPath('user.role', 'admin');
        $this->assertTrue(Hash::check('password123', User::findOrFail($id)->password));
        $this->deleteJson('/api/users/'.$id)->assertOk();
        $this->assertDatabaseMissing('users', ['id' => $id]);
    }

    public function test_admin_cannot_delete_or_demote_their_own_account(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin)->deleteJson('/api/users/'.$admin->id)
            ->assertUnprocessable()->assertJsonValidationErrors('user');
        $this->putJson('/api/users/'.$admin->id, [
            'name' => $admin->name, 'email' => $admin->email, 'role' => 'cliente',
        ])->assertUnprocessable()->assertJsonValidationErrors('role');
        $this->assertDatabaseHas('users', ['id' => $admin->id, 'role' => 'admin']);
    }

    public function test_admin_input_rejects_duplicate_emails_and_unknown_roles(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin)->postJson('/api/users', [
            'name' => 'Otra cuenta', 'email' => $admin->email, 'role' => 'superadmin',
            'password' => 'password123', 'password_confirmation' => 'password123',
        ])->assertUnprocessable()->assertJsonValidationErrors(['email', 'role']);
    }

    public function test_admin_password_reset_hashes_the_password_and_missing_users_return_404(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $client = User::factory()->create();
        $this->actingAs($admin)->putJson('/api/users/'.$client->id, [
            'name' => $client->name, 'email' => $client->email, 'role' => 'cliente',
            'password' => 'changedpass123', 'password_confirmation' => 'changedpass123',
        ])->assertOk();
        $this->assertTrue(Hash::check('changedpass123', $client->fresh()->password));
        $this->deleteJson('/api/users/999999')->assertNotFound();
    }
}
