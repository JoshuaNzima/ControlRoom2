<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Zone;

class ZoneFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Zone::class;

    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        return [
            'name' => $this->faker->city . ' Zone',
            'code' => strtoupper($this->faker->bothify('ZN-###')),
            'description' => $this->faker->sentence(),
            'status' => 'active',
            'required_guard_count' => $this->faker->numberBetween(1, 10),
            'target_sites_count' => $this->faker->numberBetween(1, 5),
        ];
    }
}
