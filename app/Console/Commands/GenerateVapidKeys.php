<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Minishlink\WebPush\VAPID;

class GenerateVapidKeys extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'webpush:vapid';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate VAPID keys for web push notifications';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Generating VAPID keys for web push notifications...');
        $this->newLine();

        try {
            $keys = VAPID::createVapidKeys();
            
            $publicKey = $keys['publicKey'];
            $privateKey = $keys['privateKey'];

            $this->info('VAPID keys generated successfully!');
            $this->newLine();

            $this->line('<fg=yellow>VAPID_PUBLIC_KEY=' . $publicKey);
            $this->line('<fg=yellow>VAPID_PRIVATE_KEY=' . $privateKey);
            $this->newLine();

            $this->info('Add these keys to your .env file:');
            $this->newLine();

            $this->line('VAPID_SUBJECT="' . config('app.url') . '"');
            $this->line('VAPID_PUBLIC_KEY=' . $publicKey);
            $this->line('VAPID_PRIVATE_KEY=' . $privateKey);
            $this->newLine();

            // Optionally update .env file
            if ($this->confirm('Do you want to automatically update your .env file?', false)) {
                $this->updateEnvFile($publicKey, $privateKey);
                $this->info('.env file updated successfully!');
            }

            return Command::SUCCESS;
        } catch (\Exception $e) {
            $this->error('Failed to generate VAPID keys: ' . $e->getMessage());
            return Command::FAILURE;
        }
    }

    /**
     * Update .env file with VAPID keys
     */
    protected function updateEnvFile(string $publicKey, string $privateKey): void
    {
        $envPath = base_path('.env');
        $envContent = file_get_contents($envPath);

        // Update or add VAPID keys
        $envContent = preg_replace(
            '/^VAPID_PUBLIC_KEY=.*$/m',
            'VAPID_PUBLIC_KEY=' . $publicKey,
            $envContent
        );

        $envContent = preg_replace(
            '/^VAPID_PRIVATE_KEY=.*$/m',
            'VAPID_PRIVATE_KEY=' . $privateKey,
            $envContent
        );

        // If keys don't exist, add them
        if (!str_contains($envContent, 'VAPID_PUBLIC_KEY=')) {
            $envContent .= "\n# Web Push Notifications (VAPID Keys)\n";
            $envContent .= "VAPID_SUBJECT=\"${config('app.url')}\"\n";
            $envContent .= "VAPID_PUBLIC_KEY={$publicKey}\n";
            $envContent .= "VAPID_PRIVATE_KEY={$privateKey}\n";
        }

        file_put_contents($envPath, $envContent);
    }
}
