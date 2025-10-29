<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
// Attempt to get providers
try {
    $providers = method_exists($app, 'getLoadedProviders') ? $app->getLoadedProviders() : [];
    echo "Providers keys:\n";
    if (is_array($providers)) {
        foreach ($providers as $k => $v) {
            echo "$k => $v\n";
        }
    } else {
        var_dump($providers);
    }
    echo "\nBound files? ";
    echo $app->bound('files') ? 'yes' : 'no';
} catch (Throwable $e) {
    echo "Exception: " . get_class($e) . ": " . $e->getMessage() . "\n";
}
