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

    /**
     * Create a new job instance.
     */
    public function __construct(int $scanId)
    {
        $this->scanId = $scanId;
        // Use the default queue connection (database) instead of hardcoding redis
        // This ensures the job runs even without Redis configured
    }

    /**
     * Execute the job.
     */
    public function handle(ScanTagger $tagger): void
    {
        $scan = CheckpointScan::with(['checkpoint.clientSite.client', 'supervisor'])->find($this->scanId);

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
            // Broadcasting should never break HTTP flows/tests.
            try {
                event(new \App\Events\ScanTagged($scanTag));
            } catch (\Throwable $broadcastError) {
                Log::warning('TagScanJob: broadcast failed (non-fatal)', [
                    'scan_id' => $scan->id,
                    'scan_tag_id' => $scanTag->id ?? null,
                    'error' => $broadcastError->getMessage(),
                    'testing' => app()->environment('testing'),
                ]);

                // In production, you may want to still surface this.
                // For this app's QR workflow, we treat broadcasting as best-effort.
                if (!app()->environment('testing')) {
                    // Keep non-fatal behavior across environments to avoid 500s.
                }
            }

            // Log success
            Log::info('Scan tagged', ['scan_id' => $scan->id, 'scan_tag_id' => $scanTag->id]);
        } catch (\Throwable $e) {
            Log::error('TagScanJob failed: ' . $e->getMessage(), ['scan_id' => $scan->id]);
            throw $e; // allow retry
        }
    }
}
