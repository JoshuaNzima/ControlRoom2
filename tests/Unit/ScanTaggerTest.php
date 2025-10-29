<?php

namespace Tests\Unit;

use App\Services\ScanTagger;
use PHPUnit\Framework\TestCase;

class ScanTaggerTest extends TestCase
{
    public function test_geohash_length()
    {
        $tagger = new ScanTagger();
        $reflection = new \ReflectionClass($tagger);
        $method = $reflection->getMethod('geohash');
        $method->setAccessible(true);

        $gh = $method->invokeArgs($tagger, [ -1.2921, 36.8219, 7 ]);
        $this->assertIsString($gh);
        $this->assertEquals(7, strlen($gh));
    }
}
