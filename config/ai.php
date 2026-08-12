<?php

return [

    /*
    |--------------------------------------------------------------------------
    | AI Provider Configuration
    |--------------------------------------------------------------------------
    |
    | Configure multiple AI providers for the chatbot. Each provider has its own
    | API credentials and model selection. The 'default' key sets which provider
    | to use when multiple are configured.
    |
    | Free Tier Options:
    | - OpenAI: Free credits for new accounts, gpt-3.5-turbo free tier
    | - Groq: Free tier with llama-3.1-8b-instant, mixtral-8x7b-32768
    | - Together AI: Free credits for new accounts
    | - OpenRouter: Access to multiple free models
    | - Anthropic: No free tier, but claude-3-haiku is cost-effective
    |
    */

    'default' => env('AI_PROVIDER', 'openai'),

    'providers' => [

        'openai' => [
            'enabled' => (bool) env('OPENAI_ENABLED', false),
            'api_key' => env('OPENAI_API_KEY'),
            'model' => env('OPENAI_MODEL', 'gpt-3.5-turbo'),
            'base_url' => env('OPENAI_BASE_URL', 'https://api.openai.com/v1'),
            'max_tokens' => (int) env('OPENAI_MAX_TOKENS', 1000),
            'temperature' => (float) env('OPENAI_TEMPERATURE', 0.7),
            'free_tier' => true,
            'free_models' => ['gpt-3.5-turbo', 'gpt-4o-mini'],
            'description' => 'OpenAI GPT models. Free tier available for gpt-3.5-turbo and gpt-4o-mini.',
        ],

        'groq' => [
            'enabled' => (bool) env('GROQ_ENABLED', false),
            'api_key' => env('GROQ_API_KEY'),
            'model' => env('GROQ_MODEL', 'llama-3.1-8b-instant'),
            'base_url' => env('GROQ_BASE_URL', 'https://api.groq.com/openai/v1'),
            'max_tokens' => (int) env('GROQ_MAX_TOKENS', 1000),
            'temperature' => (float) env('GROQ_TEMPERATURE', 0.7),
            'free_tier' => true,
            'free_models' => ['llama-3.1-8b-instant', 'llama-3.1-70b-versatile', 'mixtral-8x7b-32768'],
            'description' => 'Groq provides fast inference with Llama and Mixtral models. Generous free tier.',
        ],

        'together' => [
            'enabled' => (bool) env('TOGETHER_ENABLED', false),
            'api_key' => env('TOGETHER_API_KEY'),
            'model' => env('TOGETHER_MODEL', 'meta-llama/Llama-3-8b-chat-hf'),
            'base_url' => env('TOGETHER_BASE_URL', 'https://api.together.xyz/v1'),
            'max_tokens' => (int) env('TOGETHER_MAX_TOKENS', 1000),
            'temperature' => (float) env('TOGETHER_TEMPERATURE', 0.7),
            'free_tier' => true,
            'free_models' => ['meta-llama/Llama-3-8b-chat-hf', 'mistralai/Mixtral-8x7B-Instruct-v0.1'],
            'description' => 'Together AI offers open source models. Free credits for new accounts.',
        ],

        'openrouter' => [
            'enabled' => (bool) env('OPENROUTER_ENABLED', false),
            'api_key' => env('OPENROUTER_API_KEY'),
            'model' => env('OPENROUTER_MODEL', 'mistralai/mistral-7b-instruct:free'),
            'base_url' => env('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1'),
            'max_tokens' => (int) env('OPENROUTER_MAX_TOKENS', 1000),
            'temperature' => (float) env('OPENROUTER_TEMPERATURE', 0.7),
            'free_tier' => true,
            'free_models' => [
                'mistralai/mistral-7b-instruct:free',
                'meta-llama/llama-2-7b-chat:free',
                'google/gemma-7b-it:free',
            ],
            'description' => 'OpenRouter provides access to multiple AI providers. Several free models available.',
        ],

        'anthropic' => [
            'enabled' => (bool) env('ANTHROPIC_ENABLED', false),
            'api_key' => env('ANTHROPIC_API_KEY'),
            'model' => env('ANTHROPIC_MODEL', 'claude-3-haiku-20240307'),
            'base_url' => env('ANTHROPIC_BASE_URL', 'https://api.anthropic.com/v1'),
            'max_tokens' => (int) env('ANTHROPIC_MAX_TOKENS', 1000),
            'temperature' => (float) env('ANTHROPIC_TEMPERATURE', 0.7),
            'free_tier' => false,
            'free_models' => [],
            'description' => 'Anthropic Claude models. No free tier, but Haiku is cost-effective.',
        ],

        'gemini' => [
            'enabled' => (bool) env('GEMINI_ENABLED', false),
            'api_key' => env('GEMINI_API_KEY'),
            'model' => env('GEMINI_MODEL', 'gemini-1.5-flash'),
            'base_url' => env('GEMINI_BASE_URL', 'https://generativelanguage.googleapis.com/v1beta'),
            'max_tokens' => (int) env('GEMINI_MAX_TOKENS', 1000),
            'temperature' => (float) env('GEMINI_TEMPERATURE', 0.7),
            'free_tier' => true,
            'free_models' => ['gemini-1.5-flash', 'gemini-1.5-pro'],
            'description' => 'Google Gemini models. Free tier available with generous limits.',
        ],

        'mistral' => [
            'enabled' => (bool) env('MISTRAL_ENABLED', false),
            'api_key' => env('MISTRAL_API_KEY'),
            'model' => env('MISTRAL_MODEL', 'mistral-small-latest'),
            'base_url' => env('MISTRAL_BASE_URL', 'https://api.mistral.ai/v1'),
            'max_tokens' => (int) env('MISTRAL_MAX_TOKENS', 1000),
            'temperature' => (float) env('MISTRAL_TEMPERATURE', 0.7),
            'free_tier' => false,
            'free_models' => [],
            'description' => 'Mistral AI models. No free tier currently.',
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Fallback Configuration
    |--------------------------------------------------------------------------
    |
    | When no AI provider is configured or API fails, the system falls back to
    | rule-based responses. This ensures the chatbot always works.
    |
    */

    'fallback_enabled' => (bool) env('AI_FALLBACK_ENABLED', true),

    /*
    |--------------------------------------------------------------------------
    | Context Settings
    |--------------------------------------------------------------------------
    |
    | Settings for building context-aware prompts.
    |
    */

    'context' => [
        'max_history_messages' => (int) env('AI_MAX_HISTORY', 10),
        'include_system_stats' => (bool) env('AI_INCLUDE_STATS', true),
        'include_user_role' => (bool) env('AI_INCLUDE_ROLE', true),
    ],

];
