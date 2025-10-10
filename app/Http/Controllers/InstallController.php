<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;

class InstallController extends Controller
{
    public function welcome()
    {
        if ($this->isInstalled()) return redirect('/');
        $requirements = $this->requirements();
        return view('install.welcome', compact('requirements'));
    }

    public function check(Request $request)
    {
        if ($this->isInstalled()) return redirect('/');
        return view('install.config');
    }

    public function configure(Request $request)
    {
        if ($this->isInstalled()) return redirect('/');

        $data = $request->validate([
            'app_name' => 'required|string',
            'app_url' => 'required|string',
            'db_host' => 'required|string',
            'db_port' => 'required|numeric',
            'db_database' => 'required|string',
            'db_username' => 'required|string',
            'db_password' => 'nullable|string',
            'admin_name' => 'required|string',
            'admin_email' => 'required|email',
            'admin_password' => 'required|string|min:8',
        ]);

        $this->writeEnv($data);

        Artisan::call('key:generate', ['--force' => true]);
        Artisan::call('migrate', ['--force' => true]);

        try {
            Artisan::call('storage:link');
        } catch (\Throwable $e) {
            $this->fallbackStorageLink();
        }

        // TODO: Create admin user here or via seeder using $data

        $this->markInstalled();

        return redirect('/')->with('success', 'Installation complete.');
    }

    private function isInstalled(): bool
    {
        return File::exists(base_path('storage/installed'));
    }

    private function markInstalled(): void
    {
        File::put(base_path('storage/installed'), now()->toDateTimeString());
    }

    private function requirements(): array
    {
        return [
            'php' => version_compare(PHP_VERSION, '8.1.0', '>='),
            'exts' => [
                'openssl' => extension_loaded('openssl'),
                'pdo_mysql' => extension_loaded('pdo_mysql'),
                'mbstring' => extension_loaded('mbstring'),
                'json' => extension_loaded('json'),
                'xml' => extension_loaded('xml'),
                'ctype' => extension_loaded('ctype'),
                'fileinfo' => extension_loaded('fileinfo'),
            ],
            'writable' => [
                'storage' => is_writable(storage_path()),
                'bootstrap/cache' => is_writable(base_path('bootstrap/cache')),
            ],
        ];
    }

    private function writeEnv(array $data): void
    {
        $env = [
            'APP_NAME' => $data['app_name'],
            'APP_ENV' => 'production',
            'APP_KEY' => 'base64:',
            'APP_DEBUG' => 'false',
            'APP_URL' => $data['app_url'],
            'LOG_CHANNEL' => 'stack',
            'DB_CONNECTION' => 'mysql',
            'DB_HOST' => $data['db_host'],
            'DB_PORT' => $data['db_port'],
            'DB_DATABASE' => $data['db_database'],
            'DB_USERNAME' => $data['db_username'],
            'DB_PASSWORD' => $data['db_password'] ?? '',
            'CACHE_DRIVER' => 'file',
            'QUEUE_CONNECTION' => 'sync',
            'SESSION_DRIVER' => 'file',
            'FILESYSTEM_DISK' => 'public',
        ];

        $content = '';
        foreach ($env as $k => $v) { $content .= $k.'="'.str_replace('"', '\"', $v).'"' . "\n"; }
        File::put(base_path('.env'), $content);
    }

    private function fallbackStorageLink(): void
    {
        $publicStorage = public_path('storage');
        if (!is_dir($publicStorage)) {
            @mkdir($publicStorage, 0755, true);
        }
        $from = storage_path('app/public');
        if (is_dir($from)) {
            $it = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($from, \FilesystemIterator::SKIP_DOTS));
            foreach ($it as $file) {
                $target = $publicStorage.'/'.str_replace($from.'/', '', $file->getPathname());
                if (!is_dir(dirname($target))) @mkdir(dirname($target), 0755, true);
                if ($file->isFile()) @copy($file->getPathname(), $target);
            }
        }
    }
}


