<?php

namespace Tests\Feature;

use App\Models\LoyaltyRule;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Spatie\Permission\Models\Role;

class LoyaltyAdminUiTest extends TestCase
{
    use RefreshDatabase;

    private function makeAdminUser(): User
    {
        $role = Role::query()->firstOrCreate(['name' => 'admin']);

        $user = User::factory()->create();
        $user->assignRole($role);

        return $user;
    }

    public function test_admin_can_toggle_loyalty_on_off(): void
    {
        Setting::setValue('loyalty.enabled', true);

        $user = $this->makeAdminUser();

        $this->actingAs($user)
            ->post(route('admin.loyalty.settings.update'), [
                'loyalty_enabled' => false,
            ])
            ->assertSessionHas('success');

        $this->assertSame(false, (bool) Setting::getValue('loyalty.enabled', true));
    }

    public function test_store_rule_creates_and_updates_rule(): void
    {
        $user = $this->makeAdminUser();
        $this->actingAs($user);

        // Create
        $createPayload = [
            'name' => 'Payment Points',
            'type' => 'payment',
            'points_per_unit' => 10,
            'unit_description' => '1 MWK',
            'description' => 'Points for payments',
            'is_active' => true,
            'priority' => 1,
        ];

        $this->post(route('admin.loyalty.rules.store'), array_merge(['id' => null], $createPayload))
            ->assertSessionHas('success');

        $rule = LoyaltyRule::query()->where('name', 'Payment Points')->first();
        $this->assertNotNull($rule);
        $this->assertSame('payment', $rule->type);
        $this->assertSame(10, (int) $rule->points_per_unit);
        $this->assertSame('1 MWK', $rule->unit_description);

        // Update
        $updatePayload = [
            'id' => $rule->id,
            'name' => 'Payment Points Updated',
            'type' => 'payment',
            'points_per_unit' => 20,
            'unit_description' => '2 MWK',
            'description' => 'Updated description',
            'is_active' => false,
            'priority' => 2,
        ];

        $this->post(route('admin.loyalty.rules.store'), $updatePayload)
            ->assertSessionHas('success');

        $rule->refresh();
        $this->assertSame('Payment Points Updated', $rule->name);
        $this->assertSame('payment', $rule->type);
        $this->assertSame(20, (int) $rule->points_per_unit);
        $this->assertSame('2 MWK', $rule->unit_description);
        $this->assertSame('Updated description', $rule->description);
        $this->assertSame(false, (bool) $rule->is_active);
    }

    public function test_store_rule_validation_rejects_invalid_payload(): void
    {
        $user = $this->makeAdminUser();
        $this->actingAs($user);

        // points_per_unit must be numeric|min:0; use negative and invalid type.
        $payload = [
            'name' => 'Bad Rule',
            'type' => 'invalid_type',
            'points_per_unit' => -5,
            'unit_description' => '1 MWK',
            'description' => null,
            'is_active' => true,
            'priority' => 1,
        ];

        $this->post(route('admin.loyalty.rules.store'), $payload)
            ->assertSessionHasErrors(['type', 'points_per_unit']);
    }
}
