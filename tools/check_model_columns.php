<?php
$modelsDir = __DIR__ . '/../app/Models';
$dbPath = __DIR__ . '/../database/database.sqlite';
$pdo = new PDO('sqlite:' . $dbPath);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($modelsDir));
$phpFiles = [];
foreach ($files as $file) {
    if ($file->isFile() && preg_match('/\\.php$/', $file->getFilename())) {
        $phpFiles[] = $file->getRealPath();
    }
}

function classBaseToTable($className) {
    // Convert CamelCase to snake_case plural simple heuristic
    $snake = strtolower(preg_replace('/([a-z0-9])([A-Z])/', '$1_$2', $className));
    // handle common irregular plural for words ending with 'status' -> 'statuses'
    if (substr($snake, -6) === 'status') {
        return $snake . 'es';
    }
    // naive plural: add s if not ending with s
    if (substr($snake, -1) !== 's') $snake .= 's';
    return $snake;
}

$issues = [];
foreach ($phpFiles as $file) {
    $code = file_get_contents($file);
    // get class name
    if (!preg_match('/class\s+([A-Za-z0-9_]+)/', $code, $m)) continue;
    $class = $m[1];
    // try to get protected $table = '...'
    $table = null;
    if (preg_match('/protected\s+\$table\s*=\s*\'([^\']+)\'/i', $code, $mt)) {
        $table = $mt[1];
    } else {
        $table = classBaseToTable($class);
    }

    // extract fillable
    $fillable = [];
    if (preg_match('/protected\s+\$fillable\s*=\s*\[([^\]]*)\]/s', $code, $mf)) {
        $list = $mf[1];
        // match quoted strings
        if (preg_match_all('/\'([^\']+)\'/', $list, $ms)) {
            $fillable = $ms[1];
        }
    }

    if (empty($fillable)) continue;

    // get table columns
    try {
        $colsStmt = $pdo->query("PRAGMA table_info('$table')");
        $cols = $colsStmt->fetchAll(PDO::FETCH_ASSOC);
        $colNames = array_map(fn($c) => $c['name'], $cols);
    } catch (Exception $e) {
        $issues[] = [
            'model' => $class,
            'table' => $table,
            'error' => 'table not found',
        ];
        continue;
    }

    foreach ($fillable as $f) {
        if (!in_array($f, $colNames)) {
            $issues[] = [
                'model' => $class,
                'table' => $table,
                'missing' => $f,
            ];
        }
    }
}

if (empty($issues)) {
    echo "No missing fillable columns detected.\n";
    exit(0);
}

foreach ($issues as $i) {
    if (isset($i['error'])) {
        echo "Model {$i['model']} -> table '{$i['table']}': ERROR: {$i['error']}\n";
    } else {
        echo "Model {$i['model']} -> table '{$i['table']}': MISSING COLUMN: {$i['missing']}\n";
    }
}
