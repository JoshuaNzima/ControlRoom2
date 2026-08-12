<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\RotaTemplate;
use App\Models\RotaTemplateDay;
use App\Models\GuardRotaException;
use App\Models\Guards\Guard;
use App\Models\Guards\GuardOffDay;
use App\Services\RotaResolver;
use Carbon\Carbon;
use PHPUnit\Framework\Attributes\Test;
use Illuminate\Foundation\Testing\RefreshDatabase;

class RotaResolverTest extends TestCase
{
    use RefreshDatabase;

    private RotaResolver $resolver;

    protected function setUp(): void
    {
        parent::setUp();
        $this->resolver = app(RotaResolver::class);
    }

    protected function createGuard(array $overrides = []): Guard
    {
        return Guard::create(array_merge([
            'employee_id' => 'G-TEST-' . uniqid(),
            'name' => 'Test Guard ' . uniqid(),
            'status' => 'active',
        ], $overrides));
    }

    #[Test]
    public function it_returns_work_for_a_guard_with_no_template_and_no_exceptions()
    {
        $guard = $this->createGuard();

        $status = $this->resolver->getDayStatus($guard->id, '2026-07-01');

        $this->assertFalse($status['is_off']);
        $this->assertEquals('work', $status['reason']);
    }

    #[Test]
    public function it_returns_off_when_guard_has_off_intent_exception()
    {
        $guard = $this->createGuard();

        GuardRotaException::create([
            'guard_id' => $guard->id,
            'start_date' => '2026-07-01',
            'end_date' => '2026-07-01',
            'intent' => 'off',
            'notes' => 'Sick leave',
        ]);

        $status = $this->resolver->getDayStatus($guard->id, '2026-07-01');

        $this->assertTrue($status['is_off']);
        $this->assertEquals('intent:off', $status['reason']);
    }

    #[Test]
    public function it_returns_work_when_guard_has_work_intent_exception_against_template_off()
    {
        $guard = $this->createGuard();

        // Template says off (Sunday = 0)
        $template = RotaTemplate::create(['name' => 'Test Template']);
        RotaTemplateDay::create([
            'rota_template_id' => $template->id,
            'weekday' => 3, // Wednesday
            'is_off' => true,
        ]);
        $guard->rota_template_id = $template->id;
        $guard->save();

        // Exception overrides to work
        GuardRotaException::create([
            'guard_id' => $guard->id,
            'start_date' => '2026-07-01', // Wednesday
            'end_date' => '2026-07-01',
            'intent' => 'work',
            'notes' => 'Mandatory overtime',
        ]);

        $status = $this->resolver->getDayStatus($guard->id, '2026-07-01');

        $this->assertFalse($status['is_off']);
        $this->assertEquals('intent:work', $status['reason']);
    }

    #[Test]
    public function it_falls_back_to_template_when_no_exception_exists()
    {
        $guard = $this->createGuard();

        $template = RotaTemplate::create(['name' => 'Mon-Fri Off']);
        // Sunday=0, Monday=1, ..., Saturday=6
        // Mark all weekdays as off to make Wednesday off
        RotaTemplateDay::create([
            'rota_template_id' => $template->id,
            'weekday' => 0, // Sunday
            'is_off' => true,
        ]);
        RotaTemplateDay::create([
            'rota_template_id' => $template->id,
            'weekday' => 3, // Wednesday
            'is_off' => true,
        ]);
        $guard->rota_template_id = $template->id;
        $guard->save();

        // 2026-07-01 is a Wednesday (dayOfWeekIso = 3, dayOfWeekIso % 7 = 3)
        $status = $this->resolver->getDayStatus($guard->id, '2026-07-01');

        $this->assertTrue($status['is_off']);
        $this->assertEquals('template_off', $status['reason']);
    }

    #[Test]
    public function it_returns_work_when_template_says_work()
    {
        $guard = $this->createGuard();

        $template = RotaTemplate::create(['name' => 'Work All']);
        // Create a template day that is NOT off for Wednesday
        RotaTemplateDay::create([
            'rota_template_id' => $template->id,
            'weekday' => 3, // Wednesday
            'is_off' => false,
        ]);
        $guard->rota_template_id = $template->id;
        $guard->save();

        $status = $this->resolver->getDayStatus($guard->id, '2026-07-01'); // Wednesday

        $this->assertFalse($status['is_off']);
        $this->assertEquals('work', $status['reason']);
    }

    #[Test]
    public function it_uses_latest_exception_when_multiple_exist()
    {
        $guard = $this->createGuard();

        // Two exceptions for same day — first created
        GuardRotaException::create([
            'guard_id' => $guard->id,
            'start_date' => '2026-07-01',
            'end_date' => '2026-07-01',
            'intent' => 'off',
        ]);
        // Second created (higher id) — should win
        GuardRotaException::create([
            'guard_id' => $guard->id,
            'start_date' => '2026-07-01',
            'end_date' => '2026-07-01',
            'intent' => 'work',
        ]);

        $status = $this->resolver->getDayStatus($guard->id, '2026-07-01');

        $this->assertFalse($status['is_off']);
        $this->assertEquals('intent:work', $status['reason']);
    }

    #[Test]
    public function it_treats_swap_as_off()
    {
        $guard = $this->createGuard();

        GuardRotaException::create([
            'guard_id' => $guard->id,
            'start_date' => '2026-07-01',
            'end_date' => '2026-07-01',
            'intent' => 'swap',
        ]);

        $status = $this->resolver->getDayStatus($guard->id, '2026-07-01');

        $this->assertTrue($status['is_off']);
        $this->assertEquals('intent:swap', $status['reason']);
    }

    #[Test]
    public function it_falls_back_to_legacy_guard_off_days_when_no_template()
    {
        $guard = $this->createGuard(['rota_template_id' => null]);

        GuardOffDay::create([
            'guard_id' => $guard->id,
            'start_date' => '2026-06-28',
            'end_date' => '2026-07-05',
            'reason' => 'Annual leave',
        ]);

        $status = $this->resolver->getDayStatus($guard->id, '2026-07-01');

        $this->assertTrue($status['is_off']);
        $this->assertEquals('legacy_off_day', $status['reason']);
    }

    #[Test]
    public function it_returns_work_when_legacy_off_day_outside_range()
    {
        $guard = $this->createGuard(['rota_template_id' => null]);

        GuardOffDay::create([
            'guard_id' => $guard->id,
            'start_date' => '2026-06-01',
            'end_date' => '2026-06-07',
            'reason' => 'Annual leave',
        ]);

        $status = $this->resolver->getDayStatus($guard->id, '2026-07-01');

        $this->assertFalse($status['is_off']);
        $this->assertEquals('work', $status['reason']);
    }

    #[Test]
    public function it_favors_exception_over_legacy_off_day()
    {
        $guard = $this->createGuard(['rota_template_id' => null]);

        GuardOffDay::create([
            'guard_id' => $guard->id,
            'start_date' => '2026-06-28',
            'end_date' => '2026-07-05',
            'reason' => 'Annual leave',
        ]);

        // Exception overrides legacy fallback
        GuardRotaException::create([
            'guard_id' => $guard->id,
            'start_date' => '2026-07-01',
            'end_date' => '2026-07-01',
            'intent' => 'work',
        ]);

        $status = $this->resolver->getDayStatus($guard->id, '2026-07-01');

        $this->assertFalse($status['is_off']);
        $this->assertEquals('intent:work', $status['reason']);
    }

    #[Test]
    public function it_handles_exception_with_null_intent_as_off_fallback()
    {
        $guard = $this->createGuard();

        // Create an exception without intent (legacy migration fallback)
        $exception = new GuardRotaException();
        $exception->guard_id = $guard->id;
        $exception->start_date = '2026-07-01';
        $exception->end_date = '2026-07-01';
        $exception->exception_type = 'leave';
        $exception->save();

        $status = $this->resolver->getDayStatus($guard->id, '2026-07-01');

        // Null intent should be treated as off via the ?? 'off' fallback in resolver
        $this->assertTrue($status['is_off']);
        $this->assertEquals('intent:off', $status['reason']);
    }

    #[Test]
    public function it_handles_multi_day_exception_range()
    {
        $guard = $this->createGuard();

        // Off for a whole week
        GuardRotaException::create([
            'guard_id' => $guard->id,
            'start_date' => '2026-07-01',
            'end_date' => '2026-07-07',
            'intent' => 'off',
        ]);

        // Middle day
        $this->assertTrue($this->resolver->getDayStatus($guard->id, '2026-07-04')['is_off']);
        // Edge days
        $this->assertTrue($this->resolver->getDayStatus($guard->id, '2026-07-01')['is_off']);
        $this->assertTrue($this->resolver->getDayStatus($guard->id, '2026-07-07')['is_off']);
        // Outside range
        $this->assertFalse($this->resolver->getDayStatus($guard->id, '2026-06-30')['is_off']);
        $this->assertFalse($this->resolver->getDayStatus($guard->id, '2026-07-08')['is_off']);
    }

    #[Test]
    public function it_returns_correct_status_for_midweek_days_via_template()
    {
        $guard = $this->createGuard();

        // Template: Mon-Fri work, Sat-Sun off
        $template = RotaTemplate::create(['name' => 'Weekend Off']);
        foreach (range(1, 5) as $weekday) {
            RotaTemplateDay::create([
                'rota_template_id' => $template->id,
                'weekday' => $weekday,
                'is_off' => false,
            ]);
        }
        foreach ([0, 6] as $weekday) {
            RotaTemplateDay::create([
                'rota_template_id' => $template->id,
                'weekday' => $weekday,
                'is_off' => true,
            ]);
        }
        $guard->rota_template_id = $template->id;
        $guard->save();

        // 2026-07-01 = Wednesday → work
        $this->assertFalse($this->resolver->getDayStatus($guard->id, '2026-07-01')['is_off']);
        // 2026-07-04 = Saturday → off
        $this->assertTrue($this->resolver->getDayStatus($guard->id, '2026-07-04')['is_off']);
        // 2026-07-05 = Sunday → off
        $this->assertTrue($this->resolver->getDayStatus($guard->id, '2026-07-05')['is_off']);
    }

    #[Test]
    public function it_works_for_guards_without_template_via_getTemplateDayStatus()
    {
        $guard = $this->createGuard(['rota_template_id' => null]);

        $status = $this->resolver->getTemplateDayStatus($guard->id, '2026-07-01');

        $this->assertFalse($status['is_off']);
        $this->assertEquals('work', $status['reason']);
    }

    #[Test]
    public function template_day_status_respects_template_off_day()
    {
        $guard = $this->createGuard();

        $template = RotaTemplate::create(['name' => 'Wed Off']);
        RotaTemplateDay::create([
            'rota_template_id' => $template->id,
            'weekday' => 3, // Wednesday
            'is_off' => true,
        ]);
        $guard->rota_template_id = $template->id;
        $guard->save();

        // No exceptions — pure template
        $status = $this->resolver->getTemplateDayStatus($guard->id, '2026-07-01');

        $this->assertTrue($status['is_off']);
        $this->assertEquals('template_off', $status['reason']);
    }

    #[Test]
    public function it_handles_date_that_is_null_end_date_exception()
    {
        $guard = $this->createGuard();

        // Exception with null end_date (ongoing)
        GuardRotaException::create([
            'guard_id' => $guard->id,
            'start_date' => '2026-07-01',
            'end_date' => null,
            'intent' => 'off',
        ]);

        $this->assertTrue($this->resolver->getDayStatus($guard->id, '2026-07-15')['is_off']);
        $this->assertFalse($this->resolver->getDayStatus($guard->id, '2026-06-30')['is_off']);
    }
}
