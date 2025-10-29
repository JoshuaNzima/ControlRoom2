<?php

namespace App\Jobs;

use App\Models\Guards\CheckpointScan;
use App\Models\ScanTag;
use App\Services\ScanTagger;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class TagScanJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $scanId;

    // Attempts and backoff
    public $tries = 3;
    public $backoff = [60, 120];
    // Use dedicated redis connection for tagging jobs
    public $connection = 'redis';

    /**
     * Create a new job instance.
     */
    public function __construct(int $scanId)
    {
        $this->scanId = $scanId;
    }

    /**
     * Execute the job.
     */
    public function handle(ScanTagger $tagger): void
    {
        $scan = CheckpointScan::with('checkpoint.clientSite.client')->find($this->scanId);
            
            // Broadcast ScanTagged event so control-room receives full tag immediately
            event(new \App\Events\ScanTagged(ScanTag::latest()->first()->id ?? 0, $tags));

        if (!$scan) {
            Log::warning('TagScanJob: checkpoint scan not found: ' . $this->scanId);
            return;
        }

        try {
            $tags = $tagger->tag($scan);

            $scanTag = ScanTag::create([
                'checkpoint_scan_id' => $scan->id,
                'tags' => $tags,
            ]);

            // Broadcast the saved ScanTag instance
            event(new \App\Events\ScanTagged($scanTag));

            // Log success
            Log::info('Scan tagged', ['scan_id' => $scan->id, 'scan_tag_id' => $scanTag->id]);
        } catch (\Throwable $e) {
            Log::error('TagScanJob failed: ' . $e->getMessage(), ['scan_id' => $scan->id]);
            throw $e; // allow retry
        }
    }
}
