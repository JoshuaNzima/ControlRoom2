<?php

namespace App\Http\Middleware;

use App\Services\AiConfigSyncService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SyncAiConfigMiddleware
{
    public function __construct(protected AiConfigSyncService $aiConfigSyncService)
    {
    }

    /**
     * Sync DB-backed AI settings into runtime config before the request is handled.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $this->aiConfigSyncService->sync();

        return $next($request);
    }
}
