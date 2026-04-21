<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ReportGenerated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public string $reportType,
        public array $reportData,
        public ?int $generatedBy = null,
        public ?string $downloadUrl = null
    ) {}

    public function getData(): array
    {
        return [
            'report_type' => $this->reportType,
            'generated_by' => $this->generatedBy,
            'download_url' => $this->downloadUrl,
            'generated_at' => now()->toDateTimeString(),
            'summary' => $this->reportData['summary'] ?? null,
        ];
    }
}
