<?php
$path = __DIR__ . '/../database/database.sqlite';
$pdo = new PDO('sqlite:' . $path);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Ensure there's a ticket to attach to
$ticketId = (int)$pdo->query('SELECT id FROM tickets LIMIT 1')->fetchColumn();
if (!$ticketId) {
    echo "no ticket found\n";
    exit(1);
}

// Simulate stored file
$storageDir = __DIR__ . '/../storage/app/public/ticket-attachments';
if (!is_dir($storageDir)) mkdir($storageDir, 0755, true);
$filename = 'simulated-attachment.txt';
file_put_contents($storageDir . '/' . $filename, "This is a simulated attachment.");
$relativePath = 'ticket-attachments/' . $filename;

$stmt = $pdo->prepare('INSERT INTO ticket_attachments (ticket_id, filename, path, mime_type, size, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
$now = (new DateTime())->format('Y-m-d H:i:s');
$stmt->execute([$ticketId, $filename, $relativePath, 'text/plain', filesize($storageDir . '/' . $filename), $now, $now]);

echo "attached file to ticket $ticketId\n";
$count = (int)$pdo->query('SELECT COUNT(*) FROM ticket_attachments')->fetchColumn();
echo "ticket_attachments_count: $count\n";
