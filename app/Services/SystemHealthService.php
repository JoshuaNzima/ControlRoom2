<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class SystemHealthService
{
    public function getDatabaseSize()
    {
        $size = 0;
        
        if (config('database.default') === 'mysql') {
            $dbName = config('database.connections.mysql.database');
            $result = DB::select("SELECT Round(Sum(data_length + index_length) / 1024 / 1024, 2) as size 
                                FROM information_schema.tables 
                                WHERE table_schema = ?
                                GROUP BY table_schema", [$dbName]);
            $size = $result[0]->size ?? 0;
        } else {
            // For SQLite
            $path = DB::connection()->getDatabaseName();
            if (file_exists($path)) {
                $size = round(filesize($path) / 1024 / 1024, 2);
            }
        }

        return number_format($size, 2) . ' MB';
    }

    public function getCacheSize()
    {
        $size = 0;
        $cachePath = storage_path('framework/cache');
        
        if (is_dir($cachePath)) {
            $size = $this->getDirSize($cachePath);
        }

        return number_format($size / 1024 / 1024, 2) . ' MB';
    }

    public function getDatabaseStatus()
    {
        try {
            DB::connection()->getPdo();
            return 'Connected';
        } catch (\Exception $e) {
            return 'Error: ' . $e->getMessage();
        }
    }

    public function getStorageFree()
    {
        $storage = storage_path();
        $free = disk_free_space($storage);
        $total = disk_total_space($storage);
        $used = $total - $free;
        $percent = ($used / $total) * 100;

        return number_format((100 - $percent), 1) . '% free';
    }

    public function getMemoryUsage()
    {
        $memory = memory_get_usage(true);
        return number_format($memory / 1024 / 1024, 2) . ' MB';
    }

    public function getUptime()
    {
        if (function_exists('sys_getloadavg')) {
            $load = sys_getloadavg();
            return number_format($load[0], 2);
        }
        return 'N/A';
    }

    protected function getDirSize($directory)
    {
        $size = 0;
        foreach(glob(rtrim($directory, '/').'/*', GLOB_NOSORT) as $each) {
            $size += is_file($each) ? filesize($each) : $this->getDirSize($each);
        }
        return $size;
    }
}