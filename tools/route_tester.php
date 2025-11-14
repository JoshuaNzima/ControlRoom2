<?php
// tools/route_tester.php
// Usage: php tools/route_tester.php /path [userIdOrEmail]
// Example: php tools/route_tester.php /finance 2

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';

/** @var \Illuminate\Contracts\Http\Kernel $kernel */
$kernel = $app->make(\Illuminate\Contracts\Http\Kernel::class);
// Bootstrap the application (ensures database, providers and facades are ready)
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$path = $argv[1] ?? '/';
$userArg = $argv[2] ?? null;

$user = null;
if ($userArg) {
    if (is_numeric($userArg)) {
        $user = \App\Models\User::find((int) $userArg);
    } else {
        $user = \App\Models\User::where('email', $userArg)->first();
    }
}

if ($user) {
    \Illuminate\Support\Facades\Auth::setUser($user);
    echo "Authenticated as: {$user->id} - {$user->email} ({$user->name})\n";
} else if ($userArg) {
    echo "User '{$userArg}' not found. Proceeding as guest.\n";
} else {
    echo "No user provided. Proceeding as guest.\n";
}

// Create request
$request = \Illuminate\Http\Request::create($path, 'GET');
// Set remote server variables to match a typical HTTP request
$request->server->set('HTTP_HOST', parse_url(env('APP_URL', 'http://localhost'), PHP_URL_HOST) ?? 'localhost');
$request->server->set('HTTPS', env('APP_ENV') === 'production' ? 'on' : 'off');

// Ensure the request resolves the user we set
$request->setUserResolver(function () use ($user) {
    return $user;
});

try {
    $response = $kernel->handle($request);
} catch (\Throwable $e) {
    echo "\nException while handling request: " . get_class($e) . " - " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
    exit(1);
}

// Output summary
$status = $response->getStatusCode();
$headers = $response->headers->all();

echo "\nResponse status: {$status}\n";
if (!empty($headers)) {
    echo "Headers:\n";
    foreach ($headers as $k => $vals) {
        echo "  {$k}: " . implode(', ', $vals) . "\n";
    }
}

// If redirect, show Location header and stop
if ($response->isRedirection()) {
    $location = $response->headers->get('Location');
    echo "\nRedirect -> {$location}\n";
    // terminate kernel
    $kernel->terminate($request, $response);
    exit(0);
}

$content = (string) $response->getContent();
// Show a cleaned snippet of body
$snippet = strip_tags($content);
$snippet = preg_replace('/\s+/', ' ', $snippet);
$snippet = trim($snippet);
$max = 1200;
if (mb_strlen($snippet) > $max) {
    $snippet = mb_substr($snippet, 0, $max) . '...';
}

echo "\nBody snippet:\n";
echo $snippet . "\n";

$kernel->terminate($request, $response);

return 0;
