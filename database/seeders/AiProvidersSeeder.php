<?php

namespace Database\Seeders;

use App\Models\AiSetting;
use Illuminate\Database\Seeder;

class AiProvidersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $providers = [
            [
                'provider' => 'openai',
                'enabled' => false,
                'model' => 'gpt-3.5-turbo',
                'base_url' => 'https://api.openai.com/v1',
                'max_tokens' => 1000,
                'temperature' => 0.70,
                'description' => 'OpenAI GPT models. Free tier available for gpt-3.5-turbo and gpt-4o-mini.',
                'free_tier' => true,
                'free_models' => ['gpt-3.5-turbo', 'gpt-4o-mini', 'gpt-4o'],
            ],
            [
                'provider' => 'groq',
                'enabled' => false,
                'model' => 'llama-3.1-8b-instant',
                'base_url' => 'https://api.groq.com/openai/v1',
                'max_tokens' => 1000,
                'temperature' => 0.70,
                'description' => 'Groq provides fast inference with Llama and Mixtral models. Generous free tier.',
                'free_tier' => true,
                'free_models' => ['llama-3.1-8b-instant', 'llama-3.1-70b-versatile', 'mixtral-8x7b-32768', 'gemma2-9b-it'],
            ],
            [
                'provider' => 'together',
                'enabled' => false,
                'model' => 'meta-llama/Llama-3-8b-chat-hf',
                'base_url' => 'https://api.together.xyz/v1',
                'max_tokens' => 1000,
                'temperature' => 0.70,
                'description' => 'Together AI offers open source models. Free credits for new accounts.',
                'free_tier' => true,
                'free_models' => ['meta-llama/Llama-3-8b-chat-hf', 'mistralai/Mixtral-8x7B-Instruct-v0.1'],
            ],
            [
                'provider' => 'openrouter',
                'enabled' => false,
                'model' => 'meta-llama/llama-3-8b-instruct:free',
                'base_url' => 'https://openrouter.ai/api/v1',
                'max_tokens' => 1000,
                'temperature' => 0.70,
                'description' => 'OpenRouter provides access to multiple AI providers. Several free models available.',
                'free_tier' => true,
                'free_models' => [
                    'meta-llama/llama-3-8b-instruct:free',
                    'mistralai/mistral-7b-instruct:free',
                    'google/gemma-7b-it:free',
                    'qwen/qwen-2-7b-instruct:free',
                ],
            ],
            [
                'provider' => 'anthropic',
                'enabled' => false,
                'model' => 'claude-3-haiku-20240307',
                'base_url' => 'https://api.anthropic.com/v1',
                'max_tokens' => 1000,
                'temperature' => 0.70,
                'description' => 'Anthropic Claude models. No free tier, but Haiku is cost-effective.',
                'free_tier' => false,
                'free_models' => [],
            ],
            [
                'provider' => 'gemini',
                'enabled' => false,
                'model' => 'gemini-1.5-flash',
                'base_url' => 'https://generativelanguage.googleapis.com/v1beta',
                'max_tokens' => 1000,
                'temperature' => 0.70,
                'description' => 'Google Gemini models. Free tier available with generous limits.',
                'free_tier' => true,
                'free_models' => ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'],
            ],
            [
                'provider' => 'mistral',
                'enabled' => false,
                'model' => 'mistral-small-latest',
                'base_url' => 'https://api.mistral.ai/v1',
                'max_tokens' => 1000,
                'temperature' => 0.70,
                'description' => 'Mistral AI models. No free tier currently.',
                'free_tier' => false,
                'free_models' => [],
            ],
        ];

        foreach ($providers as $provider) {
            AiSetting::updateOrCreate(
                ['provider' => $provider['provider']],
                $provider
            );
        }

        $this->command->info('AI providers seeded successfully.');
    }
}
