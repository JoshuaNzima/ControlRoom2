<?php

namespace Tests\Feature;

use App\Jobs\TagScanJob;
use App\Services\ScanTagger;
use PHPUnit\Framework\TestCase;

class TagScanJobTest extends TestCase
{
    public function test_handle_with_missing_scan_does_not_throw()
    {
        $job = new TagScanJob(999999999); // non-existing

        // Create a simple stub for ScanTagger
        $tagger = $this->createMock(ScanTagger::class);
        $tagger->method('tag')->willReturn([]);

        // call handle - should not throw
        $job->handle($tagger);

        $this->assertTrue(true);
    }
}
