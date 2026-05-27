<?php

namespace App\Http\Controllers;

use Symfony\Component\HttpFoundation\BinaryFileResponse;

class AiWidgetAssetController extends Controller
{
    /**
     * Serve the AI widget JavaScript from the installed package or a published copy.
     */
    public function __invoke(): BinaryFileResponse
    {
        $paths = [
            base_path('vendor/alidaaer/laravel-ai-agent/resources/js/widget/ai-agent-chat.js'),
            public_path('vendor/ai-agent/ai-agent-chat.js'),
        ];

        foreach ($paths as $path) {
            if (is_file($path)) {
                return response()->file($path, [
                    'Content-Type' => 'application/javascript; charset=UTF-8',
                    'Cache-Control' => 'public, max-age=86400',
                ]);
            }
        }

        abort(404, 'AI widget asset not found.');
    }
}
