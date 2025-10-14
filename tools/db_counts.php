<?php
$path = __DIR__ . '/../database/database.sqlite';
if (!file_exists($path)) {
    echo "database not found: $path\n";
    exit(1);
}
$pdo = new PDO('sqlite:' . $path);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$tables = [
    'flags','tickets','incidents','incident_comments','downs','cameras','conversations','messages','clients','client_sites','guards'
];
foreach ($tables as $t) {
    try {
        $count = (int)$pdo->query("SELECT COUNT(*) FROM $t")->fetchColumn();
        echo sprintf("%s: %d\n", $t, $count);
    } catch (Exception $e) {
        echo sprintf("%s: ERROR (%s)\n", $t, $e->getMessage());
    }
}
