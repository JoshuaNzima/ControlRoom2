<?php
$path = __DIR__ . '/../database/database.sqlite';
$pdo = new PDO('sqlite:' . $path);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$now = (new DateTime())->format('Y-m-d H:i:s');
$stmt = $pdo->prepare('INSERT INTO tickets (title, description, status, priority, category, reported_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
$stmt->execute(["Automated Test Ticket", "This is a test ticket inserted by the audit script.", 'open', 'low', 'request', 1, $now, $now]);
$last = $pdo->lastInsertId();
$count = (int)$pdo->query('SELECT COUNT(*) FROM tickets')->fetchColumn();
echo "inserted_ticket_id: $last\n";
echo "tickets_count: $count\n";
