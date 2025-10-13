<?php
$path = __DIR__ . '/../database/database.sqlite';
$pdo = new PDO('sqlite:' . $path);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$tables = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;")->fetchAll(PDO::FETCH_COLUMN);
foreach ($tables as $table) {
    echo "-- $table --\n";
    $cols = $pdo->query("PRAGMA table_info('$table');")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($cols as $col) {
        echo sprintf("%s \t %s \t %s\n", $col['name'], $col['type'], $col['notnull'] ? 'NOT NULL' : 'NULLABLE');
    }
    echo "\n";
}
