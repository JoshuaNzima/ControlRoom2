<?php

// Script to help migrate ControlRoom controllers to Operations module
// Usage: php tools/migrate_control_room.php

$basePath = dirname(__DIR__);
$sourceDir = $basePath . '/app/Http/Controllers/ControlRoom';
$targetDir = $basePath . '/app/Http/Controllers/Operations/ControlRoom';

// Create target directory if it doesn't exist
if (!is_dir($targetDir)) {
    mkdir($targetDir, 0777, true);
}

// Get all controller files
$files = glob($sourceDir . '/*.php');

foreach ($files as $file) {
    $fileName = basename($file);
    $targetFile = $targetDir . '/' . $fileName;
    
    // Read the file content
    $content = file_get_contents($file);
    
    // Update namespace
    $content = str_replace(
        'namespace App\Http\Controllers\ControlRoom;',
        'namespace App\Http\Controllers\Operations\ControlRoom;',
        $content
    );
    
    // Write to new location
    file_put_contents($targetFile, $content);
    
    echo "Migrated {$fileName}\n";
}

echo "\nMigration complete! Remember to:\n";
echo "1. Update route file controller references\n";
echo "2. Update any controller references in services/providers\n";
echo "3. Update view paths in controllers\n";
echo "4. Test all routes after migration\n";